# 🚁 Blender-Datei zu GLB konvertieren

## Problem
Die `uploads-files-5733169-drone.blend` Datei kann nicht direkt im Browser geladen werden. Wir müssen sie zu einer GLB-Datei konvertieren.

## 🔧 Lösung: Blender-Datei konvertieren

### Option 1: Mit Blender (empfohlen)
1. **Blender öffnen** (kostenlos: https://www.blender.org/)
2. **Datei öffnen**: `uploads-files-5733169-drone.blend`
3. **Exportieren**: File → Export → glTF 2.0 (.glb/.gltf)
4. **Als GLB speichern**: `drone.blb` im `public/` Ordner
5. **Code anpassen**: `useGLTF('/drone.glb')`

### Option 2: Online-Konverter
1. Gehe zu: https://products.aspose.app/3d/conversion/blend-to-gltf
2. Lade die `.blend` Datei hoch
3. Konvertiere zu GLB
4. Lade die GLB-Datei herunter
5. Kopiere sie in den `public/` Ordner

### Option 3: Command Line (falls Blender installiert)
```bash
# Blender Command Line Export
blender uploads-files-5733169-drone.blend --background --python-expr "
import bpy
bpy.ops.export_scene.gltf(filepath='public/drone.glb', export_format='GLB')
"
```

## 🚀 Nach der Konvertierung

### Code anpassen:
```typescript
// In page.tsx ändern:
useGLTF.preload('/drone.glb'); // Statt dji_phantom4.glb

function DroneModel({ droneRef }) {
  const { scene } = useGLTF('/drone.glb'); // Neue Datei
  // ... rest bleibt gleich
}
```

### Testen:
```bash
npm run dev
# Gehe zu http://localhost:3002
```

## 🎯 Erwartetes Ergebnis
- ✅ Professionelle Drohne aus Blender
- ✅ Korrekte Materialien und Texturen
- ✅ Möglicherweise bereits animierte Rotoren
- ✅ Realistische Proportionen

## 🐛 Troubleshooting
- **Datei nicht gefunden**: Überprüfe den Pfad im `public/` Ordner
- **Material-Fehler**: Blender-Materialien müssen für Web optimiert werden
- **Größe zu groß**: Komprimiere die Texturen in Blender

## 📁 Datei-Struktur nach Konvertierung:
```
drohne-3d/
├── public/
│   ├── drone.glb          ← Neue konvertierte Datei
│   └── uploads-files-5733169-drone.blend ← Original
└── app/
    └── page.tsx           ← Code anpassen
```

**Sobald die GLB-Datei erstellt ist, können wir sie in der React-App verwenden!** 🚁✨
