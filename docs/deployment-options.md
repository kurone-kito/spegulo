# Deployment Options

> **Status: research input, not a decision.** This document compares
> candidate deployment environments for OpenClaw so the maintainer can
> make the target-environment decision tracked in
> [#7](https://github.com/kurone-kito/spegulo/issues/7). Nothing in
> this document is itself a decision -- see the
> [Recommendation](#recommendation) section for how it is meant to be
> read. Background and the open question this document feeds are
> recorded in [`requirements.md`](requirements.md#open-questions) and
> roadmap [#1](https://github.com/kurone-kito/spegulo/issues/1).

## Scope

This comparison covers the host operating systems and GPU vendor the
maintainer's own environment and OpenClaw's own documented model
support actually involve:

- **Host OS**: Windows with WSL2, and Linux. The maintainer's
  environment is WSL2, and WSL2 GPU compute is effectively an NVIDIA
  CUDA-only path today -- see [GPU access](#gpu-access) below. macOS
  and non-WSL2 Windows GPU compute are out of scope.
- **GPU vendor**: NVIDIA. OpenClaw's own
  [README](https://github.com/openclaw/openclaw) documents hosted and
  local model providers but no AMD ROCm path, so AMD/Intel GPU
  passthrough is out of scope here rather than silently assumed
  equivalent.

Every factual claim about GPU passthrough support below cites a
primary source (vendor or project documentation) with the date it was
consulted, so a later reader can judge how stale the comparison is.

## Candidates

### 1. Local containers (Docker or Podman, host GPU exposed)

OpenClaw runs inside a container on the operator's own machine, with
the host GPU exposed into the container for local inference. This is
the maintainer's stated preferred shape.

### 2. A virtual machine on local hardware

OpenClaw runs inside a general-purpose VM (KVM/libvirt on a Linux
host, or Hyper-V on a Windows host) created and managed by the
operator on their own machine, with the GPU passed through to that
VM.

### 3. A cloud IaaS instance, with and without an attached GPU

OpenClaw runs on a rented cloud virtual machine. The GPU-attached
variant targets local inference; the non-GPU variant targets the
hosted-model-API mode described under
[GPU necessity](#whether-a-gpu-is-needed-at-all).

### 4. A bare local install (baseline)

OpenClaw runs directly on the operator's machine with no container or
VM boundary at all. This is the baseline the other three candidates
are judged against.

## Comparison

### GPU access

| Candidate | Mechanism | WSL2 case | What breaks it |
| --- | --- | --- | --- |
| Local containers | NVIDIA Container Toolkit configures the container runtime (`nvidia-ctk runtime configure --runtime=docker`) so `docker run --gpus all` or Podman's `--gpus`/CDI device selection exposes the GPU [^toolkit] | Docker Desktop's GPU support is WSL2-backend-only; the NVIDIA driver installs on the **Windows host only**, never inside the WSL2 distro; only `--gpus all` is supported, not per-GPU index selection, on Docker 19.03+ [^wsl-cuda] [^docker-gpu] | Installing a Linux display driver inside WSL2 instead of relying on the Windows host driver; using Docker's Hyper-V backend instead of the WSL2 backend; a pre-R495 driver or pre-Pascal GPU [^wsl-cuda] |
| Local VM | Linux: VFIO PCI passthrough, needs IOMMU (Intel VT-d / AMD-Vi) enabled and the GPU bound to `vfio-pci` instead of its normal driver [^ubuntu-kvm-gpu]. Windows: Hyper-V Discrete Device Assignment (DDA) or GPU Partitioning (GPU-P) [^dda-deploy] [^gpu-p] | Not applicable -- WSL2 itself is not a general-purpose VM the operator provisions; its GPU path is covered under Local containers above | Linux: IOMMU disabled in BIOS, a device stuck in a shared IOMMU group, or a missing driver blocklist [^ubuntu-kvm-gpu]. Windows: **both DDA and GPU-P require a Windows Server host**; per Microsoft's own requirements, DDA "requires server class hardware" [^dda-plan], and GPU-P's supported GPU list is enterprise cards (NVIDIA A2/A10/A16/A40/L2/L4/L40/L40S/RTX Pro 6000 Blackwell Server Edition, AMD Radeon PRO V710) [^gpu-p] -- neither is available on a Windows 11 client host with a consumer GPU, which is the maintainer's actual machine class |
| Cloud IaaS (GPU) | Provider-managed passthrough on GPU-attached instance families, e.g. AWS EC2 G5 (NVIDIA A10G), P5 (NVIDIA H100), or P5e/P5en (NVIDIA H200) [^aws-p5] [^aws-g5], or Google Cloud Compute Engine GPU-attached VMs (T4/V100/P100/P4 on N1, or G2/G4 families) [^gcp-gpu]; the operator never touches IOMMU or VFIO directly | Not applicable | Choosing a non-GPU instance family, or a region/zone without GPU capacity |
| Cloud IaaS (no GPU) | None needed -- standard compute instance, paired with a hosted model API | Not applicable | Not applicable |
| Bare local install | Native OS GPU driver install; no passthrough boundary to cross | The host OS itself is the runtime -- there is no WSL2 layer in this candidate | A missing or incompatible native driver only |

### Whether a GPU is needed at all

OpenClaw's own README states: "OpenClaw works with hosted and local
model providers" [^openclaw-readme]. When a deployment uses a hosted
model API instead of local inference, none of the GPU-access mechanisms
above are load-bearing:

| Candidate | GPU-constrained under local inference | GPU-constrained under hosted-API mode |
| --- | --- | --- |
| Local containers | Yes -- needs the WSL2/native GPU passthrough path above | No |
| Local VM | Yes -- needs VFIO (Linux) or DDA/GPU-P (Windows) | No |
| Cloud IaaS (GPU) | Yes -- needs a GPU-attached instance family | No (use the non-GPU variant instead) |
| Bare local install | Yes -- needs a working native driver | No |

Choosing hosted-model-API mode removes GPU access as a differentiator
across all four candidates and reduces the decision to the remaining
criteria below.

### Reproducibility

- **Local containers** -- high. A Dockerfile or Compose file is
  checked-in code; rebuilding from the repository alone reproduces an
  equivalent environment, modulo base-image drift.
- **Local VM** -- medium. VM provisioning (a Packer template or
  cloud-init script) can be reproducible, but the host-side GPU setup
  -- BIOS IOMMU settings, driver blocklists, or the Hyper-V DDA
  PowerShell sequence [^dda-deploy] -- is manual and outside the
  repository's reach.
- **Cloud IaaS** -- high with an IaC tool (for example Terraform):
  instance type, image, and startup scripts are declarative and
  version-controlled, though provider-side capacity and region
  variability remain.
- **Bare local install** -- low. Install steps are typically
  imperative commands run against one machine's existing state, with
  no boundary guaranteeing the same result on a rebuilt or different
  host.

### Knowledge-volume injection

- **Local containers** -- a bind mount or named volume attaches
  external knowledge content at run time, cleanly outside both the
  repository and the image.
- **Local VM** -- an attached disk or shared folder does the same job,
  as an extra provisioning step outside the application definition.
- **Cloud IaaS** -- a block-storage volume or object-storage bucket
  mounted or fetched at boot; a common, well-supported pattern, but
  tied to a specific provider's storage primitives unless abstracted.
- **Bare local install** -- any filesystem path on the host; simplest
  mechanically, but nothing in the tooling stops the operator from
  accidentally co-locating knowledge content with the repository
  checkout.

### Operational cost and burden

- **Local containers** -- the operator patches the host OS, the
  container engine, and the GPU driver; no cloud spend; overhead is
  the container runtime, not raw hardware cost.
- **Local VM** -- the operator patches the host OS, the hypervisor,
  the guest OS, and the GPU driver/passthrough stack: the largest
  patching surface of the four, and on Windows it additionally
  requires Windows Server licensing plus IHV-approved DDA/GPU-P
  hardware [^dda-plan] [^gpu-p].
- **Cloud IaaS (GPU)** -- the provider patches the hypervisor and host
  firmware; the operator still patches the guest OS; GPU-hour billing
  is typically the dominant, and least "personal-budget-shaped," cost
  line.
- **Cloud IaaS (no GPU)** -- the same operational split as above, at a
  materially lower hourly cost.
- **Bare local install** -- the operator patches everything (OS,
  drivers, OpenClaw's own runtime dependencies) with no isolation
  boundary cushioning a bad update: the lowest infrastructure cost and
  the highest single-host blast radius.

### Portability

- **Local containers** -- highest. A Dockerfile or Compose definition
  travels almost unchanged between a local machine, a local VM's guest
  OS, or a cloud container service.
- **Local VM** -- medium on Linux, where a KVM provisioning script can
  often be adapted to a cloud "bring your own image" flow; materially
  lower on Windows, since DDA/GPU-P depend on Windows Server and
  enterprise-class GPU hardware a personal deployment rarely has cheap
  access to [^dda-plan] [^gpu-p].
- **Cloud IaaS** -- the provider-specific IaC layer (instance type,
  image, networking) is the least portable piece, but the workload
  definition running inside the instance can still be the same
  container image used by the local-container candidate.
- **Bare local install** -- lowest. Install steps are typically
  written against one machine's specific OS and package-manager
  state and do not travel to a different environment class without a
  rewrite.

## Recommendation

This section names a preferred option and its reasoning. It is input
to the maintainer's pending decision in
[#7](https://github.com/kurone-kito/spegulo/issues/7), not a decision
already taken -- #7 remains the record of what is actually chosen.

**Local containers on Docker Desktop's WSL2 backend** is the candidate
this comparison favors:

1. It matches the maintainer's stated preferred shape (Docker).
2. Its GPU-access path is documented and mechanical -- Docker
   Desktop's WSL2 backend plus the NVIDIA Container Toolkit and a
   Windows-host driver [^wsl-cuda] [^docker-gpu] -- unlike the
   Windows local-VM candidate, whose native GPU-passthrough
   mechanisms require a Windows Server host and, for GPU-P,
   enterprise-class GPU hardware [^dda-plan] [^gpu-p], neither of
   which matches a Windows 11 client machine.
3. It scores highest on reproducibility and portability among the
   four candidates, so any later move to cloud IaaS can reuse the
   same container definition rather than rewriting it.
4. If local-GPU passthrough proves too fragile in practice, switching
   to hosted-model-API mode removes the GPU constraint entirely
   without changing candidates -- the same container definition runs
   either way (see [GPU necessity](#whether-a-gpu-is-needed-at-all)).

If GPU passthrough friction persists even inside a container, cloud
IaaS with a GPU-attached instance is the next most portable fallback,
since it can reuse the same container image. A local VM on a Linux
host (KVM/VFIO) is a viable, if more operationally demanding,
alternative; a local VM on a Windows host is not recommended given the
DDA/GPU-P host-class mismatch above. The bare local install is the
least recommended candidate: it has the lowest reproducibility and
portability of the four, and its only advantage -- no passthrough
boundary to configure -- stops mattering as soon as hosted-model-API
mode is in play, since none of the other candidates need that
boundary either in that mode.

## Sources

All sources below were consulted on 2026-08-08.

[^toolkit]: NVIDIA, ["Installing the NVIDIA Container Toolkit"](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html), NVIDIA Container Toolkit documentation.
[^wsl-cuda]: NVIDIA, ["CUDA on WSL User Guide"](https://docs.nvidia.com/cuda/wsl-user-guide/index.html), NVIDIA CUDA on WSL documentation.
[^docker-gpu]: Docker, ["GPU support"](https://docs.docker.com/desktop/features/gpu/), Docker Desktop documentation.
[^ubuntu-kvm-gpu]: Canonical, ["GPU virtualisation with QEMU/KVM"](https://ubuntu.com/server/docs/how-to/graphics/gpu-virtualization-with-qemu-kvm/), Ubuntu Server documentation.
[^dda-deploy]: Microsoft, ["Deploy graphics devices by using Discrete Device Assignment"](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/deploy/deploying-graphics-devices-using-dda), Microsoft Learn, last updated 2026-02-02.
[^dda-plan]: Microsoft, ["Deploy devices by using Discrete Device Assignment"](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/plan/plan-for-deploying-devices-using-discrete-device-assignment), Microsoft Learn, last updated 2025-09-15.
[^gpu-p]: Microsoft, ["Partition and share GPUs with virtual machines on Hyper-V"](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/gpu-partitioning), Microsoft Learn, last updated 2026-05-05.
[^aws-p5]: Amazon Web Services, ["Amazon EC2 P5 Instances"](https://aws.amazon.com/ec2/instance-types/p5/).
[^aws-g5]: Amazon Web Services, ["Amazon EC2 G5 Instances"](https://aws.amazon.com/ec2/instance-types/g5/).
[^gcp-gpu]: Google Cloud, ["About GPU instances"](https://docs.cloud.google.com/compute/docs/gpus/about-gpus), Compute Engine documentation.
[^openclaw-readme]: OpenClaw project, [`openclaw/openclaw` README](https://github.com/openclaw/openclaw).
