
from fastapi import FastAPI, File, UploadFile
import torch
import numpy as np
from PIL import Image
import io
from torchvision import transforms
import timm
import torch.nn as nn

# Include the Architecture here so the API is self-contained
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
        self.heads = nn.ModuleDict({f'part_{i}': nn.Linear(feature_dim, num_classes) for i in range(5)})

    def forward(self, x):
        features = self.backbone(x)[0]
        features = self.attention(features)
        pooled = self.adaptive_pool(features)
        fused_features = pooled.reshape(pooled.size(0), -1)
        return None, fused_features

app = FastAPI()
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = GaitConvNeXtMultiBranch(num_classes=86)
model.load_state_dict(torch.load('model_weights.pth', map_location=device))
model.eval().to(device)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    image = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        _, features = model(image)
    return {"feature_vector": features.cpu().numpy().tolist()}
