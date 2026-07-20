#🚶‍♂️ Part-Based Gait Recognition System

An enterprise-grade, end-to-end computer vision platform that identifies individuals based on their walking patterns (gait) using a multi-branch ConvNeXt neural network. 

Unlike traditional facial or fingerprint recognition, this system provides robust biometric identification in environments with low-resolution footage, severe camera angles, or heavy physical occlusion (e.g., masks, heavy coats, carried bags).

## 🚀 Business Value & Motivation
Traditional biometric systems fail under occlusion or poor lighting. By analyzing the temporal and spatial movements of a human silhouette (Gait Energy Image), this system can accurately identify subjects without requiring direct interaction or facial visibility, making it highly suitable for real-world security and surveillance.

## 🏗️ System Architecture

This project bridges deep learning research with a deployable, decoupled web infrastructure:

*   **Frontend (React.js):** A responsive dashboard for security personnel to upload surveillance footage, manage the biometric database, and view matching results.
*   **Web Backend (Node.js, Express, MongoDB):** Handles user authentication, database management, and routes video processing requests.
*   **Inference API (FastAPI / Hugging Face):** A dedicated microservice that receives video frames, executes the PyTorch model pipeline, and returns identification metrics.
*   **Machine Learning (PyTorch):** A custom ensemble architecture utilizing **ConvNeXt-Tiny** to extract spatial-temporal features from human silhouettes.

## 🧠 Model Pipeline & Engineering

The core pipeline processes raw video into robust, 768-dimensional feature vectors:

1.  **Silhouette Extraction & GEI:** Videos are processed into binary silhouettes via background subtraction, normalized (224x224), and aggregated into a single **Gait Energy Image (GEI)**.
2.  **Horizontal Segmentation:** The GEI is split into 5 localized parts (Head, Chest, Waist, Thigh, Leg) with a **10% spatial overlap** to preserve limb boundaries.
3.  **Dynamic Part Removal:** If a subject is carrying a bag or wearing a heavy coat, the system calculates the absolute difference against a normal reference. It dynamically masks corrupted pixels (e.g., the chest/waist) to zero, preventing the model from learning noisy data.
4.  **Feature Fusion (Meta-Model):** 5 part-specific ConvNeXt-Tiny heads process the segments and fuse them into a unified 768-dim embedding. 
5.  **Classification:** Identification is finalized using Cosine Similarity (Rank-1 matching).

## 📊 Engineering Trade-offs & Performance

Tested on the widely-benchmarked **CASIA-B Dataset**, the system achieves an **82.5% overall accuracy**, with a **99.0% accuracy on normal walking**.

| Condition | Baseline Accuracy | Our Architecture |
| :--- | :--- | :--- |
| **Normal Walking (NM)** | 92.3% | **99.0%** |
| **Carrying a Bag (BG)** | 84.3% | **86.4%** |
| **Wearing a Coat (CL)** | 60.6% | **62.2%** |

**Key Architectural Decisions:**
*   **ConvNeXt-Base vs. ConvNeXt-Tiny:** Swapped the baseline 88M parameter model for a 28M parameter model. By combining this lighter backbone with the AdamW optimizer and a 10% spatial overlap strategy, the system achieved a +6.7% accuracy gain on normal walking while drastically reducing inference time for edge-device compatibility.
*   **Decoupled Infrastructure:** Separating the FastAPI inference server from the Node.js web backend ensures that heavy GPU tensor operations do not block standard web requests.

## 🔮 Future Work
*   **Multi-Modal Fusion**: Integrating skeleton keypoints alongside GEI silhouettes to further mitigate the impact of heavy clothing.

*   **Real-Time Edge Deployment**: Migrating the pipeline to support live RTSP camera streams.

## 💻 How to Run Locally

### 1. Start the Inference Server
```bash
cd hf_inference_api
pip install -r requirements.txt
uvicorn app:app --reloadm
