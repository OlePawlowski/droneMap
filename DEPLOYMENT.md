# Deployment-Anleitung

Diese Anleitung zeigt, wie Sie das 3D-Drohnen-Programm online hosten können, sodass es über einen HTTPS-Link in einem iFrame erreichbar ist.

## Option 1: Vercel (Empfohlen - Einfachste Methode)

Vercel ist die einfachste Lösung für Next.js-Apps, da es nahtlos integriert ist.

### Schritte:

1. **Projekt auf GitHub hochladen** (optional, aber empfohlen)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <IHR_GITHUB_REPO>
   git push -u origin main
   ```

2. **Vercel-Konto erstellen**
   - Gehen Sie zu [vercel.com](https://vercel.com)
   - Melden Sie sich mit GitHub an
   - Klicken Sie auf "Add New Project"

3. **Projekt importieren**
   - Wählen Sie Ihr GitHub-Repository
   - Vercel erkennt automatisch, dass es eine Next.js-App ist
   - Klicken Sie auf "Deploy"

4. **Fertig!**
   - Nach dem Deployment erhalten Sie eine URL wie: `https://ihr-projekt.vercel.app`
   - Die Embed-Seite ist unter `https://ihr-projekt.vercel.app/embed` erreichbar

### iFrame-Integration:

```html
<iframe 
  src="https://ihr-projekt.vercel.app/embed" 
  width="100%" 
  height="700" 
  frameborder="0"
  title="Statikbüro 3D Drohnen Tour">
</iframe>
```

## Option 2: Netlify

1. **Netlify-Konto erstellen** auf [netlify.com](https://netlify.com)
2. **Build-Einstellungen**:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Deployment**: Projekt aus GitHub importieren oder manuell hochladen

## Option 3: Eigenes Hosting

### Voraussetzungen:
- Node.js 18+ auf dem Server
- Domain mit SSL-Zertifikat (HTTPS erforderlich)

### Schritte:

1. **Projekt bauen**:
   ```bash
   npm run build
   ```

2. **Produktions-Server starten**:
   ```bash
   npm start
   ```
   Standardmäßig läuft der Server auf Port 3000.

3. **Mit PM2 für dauerhaften Betrieb**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "drohne-3d" -- start
   pm2 save
   pm2 startup
   ```

4. **Reverse Proxy mit Nginx** (für HTTPS):
   ```nginx
   server {
       listen 80;
       server_name ihre-domain.de;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name ihre-domain.de;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Wichtige Hinweise

### 1. HTTPS erforderlich
Für die Einbettung in iFrames auf anderen Websites ist HTTPS zwingend erforderlich. Vercel und Netlify bieten automatisch kostenloses SSL.

### 2. CORS-Header (falls nötig)
Falls Sie Probleme mit Cross-Origin-Requests haben, können Sie in `next.config.ts` folgendes hinzufügen:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/embed',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          },
        ],
      },
    ];
  },
};
```

### 3. Umgebungsvariablen
Falls Sie Umgebungsvariablen verwenden, müssen diese in den Deployment-Einstellungen konfiguriert werden.

## Testen

Nach dem Deployment können Sie die Einbettung testen:

1. Hauptseite: `https://ihre-url.de`
2. Embed-Seite: `https://ihre-url.de/embed`
3. iFrame-Test: Erstellen Sie eine HTML-Datei mit einem iFrame, das auf die Embed-URL zeigt

## Support

Bei Fragen oder Problemen:
- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

