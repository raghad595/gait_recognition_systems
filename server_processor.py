import torch
import numpy as np
from PIL import Image
import io
from torchvision import transforms
import timm
import torch.nn as nn
import cv2
import tempfile
import os

class PartAttention(nn.Module):
    def __init__(self, channel, reduction=16):
        super(PartAttention, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channel, channel // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channel // reduction, channel, bias=False),
            nn.Sigmoid()
        )
    def forward(self, x):
        b, c, _, _ = x.size()
        y = self.avg_pool(x).view(b, c)
        y = self.fc(y).view(b, c, 1, 1)
        return x * y.expand_as(x)

class GaitConvNeXtMultiBranch(nn.Module):
    def __init__(self, num_classes=86, pretrained=False):
        super(GaitConvNeXtMultiBranch, self).__init__()
        self.backbone = timm.create_model('convnext_tiny', pretrained=pretrained, features_only=True, out_indices=[-1])
        feature_dim = 768
        self.attention = PartAttention(feature_dim)
        self.num_parts = 5
        self.adaptive_pool = nn.AdaptiveAvgPool2d((self.num_parts, 1))
        
        self.heads = nn.ModuleDict({
            f'part_{i}': nn.Sequential(
                nn.Linear(feature_dim, 512),      
                nn.BatchNorm1d(512),              
                nn.ReLU(),                        
                nn.Dropout(p=0.5),                
                nn.Linear(512, num_classes)       
            ) for i in range(5)
        })

    def forward(self, x):
        features = self.backbone(x)[0]
        features = self.attention(features)
        pooled = self.adaptive_pool(features)
        fused_features = pooled.reshape(pooled.size(0), -1)
        return None, fused_features

# --- INITIALIZE ONCE ---
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = GaitConvNeXtMultiBranch(num_classes=86)
model.load_state_dict(torch.load('model_weights.pth', map_location=device))
model.eval().to(device)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def process_image(file_bytes: bytes):
    """Handles static image processing."""
    image = Image.open(io.BytesIO(file_bytes)).convert('RGB')
    image = transform(image).unsqueeze(0).to(device)
    
    with torch.no_grad():
        _, features = model(image)
        
    return features.cpu().numpy().tolist()

def process_video(file_bytes: bytes):
    """Handles video frame extraction and batched inference."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        temp_video.write(file_bytes)
        temp_video_path = temp_video.name

    try:
        cap = cv2.VideoCapture(temp_video_path)
        frames = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(frame_rgb)
            tensor_img = transform(pil_img)
            frames.append(tensor_img)
            
        cap.release()
        
        if not frames:
            return None, 0

        max_frames = 30
        if len(frames) > max_frames:
            indices = np.linspace(0, len(frames) - 1, max_frames, dtype=int)
            frames = [frames[i] for i in indices]

        batch = torch.stack(frames).to(device)

        with torch.no_grad():
            _, features = model(batch)
        
        gait_signature = features.mean(dim=0)
        return gait_signature.cpu().numpy().tolist(), len(frames)
        
    finally:
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
