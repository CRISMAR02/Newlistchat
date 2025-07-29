# 🚀 Guía Completa: Configurar WebSocket para el Chat

## 📋 Opciones Disponibles

### 🥇 **Opción 1: Railway (Recomendado - Más Fácil)**

#### Paso 1: Crear cuenta en Railway
1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub (gratis)
3. Verifica tu email

#### Paso 2: Subir tu código a GitHub
```bash
# Si no tienes Git configurado:
git init
git add .
git commit -m "Initial commit with chat"
git branch -M main

# Crear repositorio en GitHub y conectar:
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

#### Paso 3: Desplegar en Railway
1. En Railway, haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Conecta tu repositorio
4. Railway detectará automáticamente tu `package.json`
5. El despliegue iniciará automáticamente

#### Paso 4: Obtener la URL
1. Una vez desplegado, ve a tu proyecto en Railway
2. En la pestaña "Settings" → "Domains"
3. Copia la URL que aparece (ej: `tu-proyecto-123.up.railway.app`)
4. Tu URL del WebSocket será: `wss://tu-proyecto-123.up.railway.app`

---

### 🥈 **Opción 2: Render (Alternativa Fácil)**

#### Pasos:
1. Ve a [render.com](https://render.com)
2. Regístrate gratis
3. "New" → "Web Service"
4. Conecta tu repositorio GitHub
5. Configuración:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Environment**: Node
6. Desplegar
7. Tu URL será: `wss://tu-app.onrender.com`

---

### 🥉 **Opción 3: Usar Servicio Local (Para Testing)**

Si solo quieres probar localmente sin desplegar:

```bash
# Terminal 1: Iniciar servidor WebSocket
npm run chat:server

# Terminal 2: Iniciar frontend
npm run dev
```

URL local: `ws://localhost:8080`

---

## ⚙️ Configuración en tu Proyecto

### Una vez que tengas tu URL, actualiza estos archivos:

#### 1. Crear archivo `.env.production`
```env
VITE_WEBSOCKET_URL=wss://TU-URL-AQUI.railway.app
```

#### 2. Actualizar `.env` para desarrollo
```env
VITE_WEBSOCKET_URL=ws://localhost:8080
```

#### 3. El código ya está preparado para usar estas variables

---

## 🎯 **Recomendación: Railway**

**¿Por qué Railway?**
- ✅ **Gratis** hasta 500 horas/mes
- ✅ **Fácil setup** - Solo conectar GitHub
- ✅ **WebSockets nativos** - Sin configuración extra
- ✅ **SSL automático** - HTTPS/WSS incluido
- ✅ **Escalabilidad** - Crece con tu app
- ✅ **Logs en tiempo real** - Para debugging

---

## 📱 Pasos Detallados para Railway

### 1. Preparar tu código
Tu código ya está listo, solo necesitas subirlo a GitHub.

### 2. GitHub (si no lo tienes)
```bash
# Inicializar Git
git init
git add .
git commit -m "Add chat system"

# Crear repo en GitHub.com y luego:
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

### 3. Railway Setup
1. **Ir a Railway**: [railway.app](https://railway.app)
2. **Login con GitHub**
3. **"New Project"** → **"Deploy from GitHub repo"**
4. **Seleccionar tu repositorio**
5. **Esperar el deploy** (2-3 minutos)

### 4. Obtener URL
1. **Ir a tu proyecto en Railway**
2. **Settings** → **Domains**
3. **Copiar la URL** (ej: `magical-train-123.up.railway.app`)

### 5. Configurar en tu proyecto
```env
# .env.production
VITE_WEBSOCKET_URL=wss://magical-train-123.up.railway.app
```

### 6. Redesplegar frontend
Si usas Vercel/Netlify para el frontend:
1. Agregar la variable `VITE_WEBSOCKET_URL` en su dashboard
2. Redesplegar

---

## 🔧 Verificar que Funciona

### 1. Desarrollo Local
```bash
npm run dev:full
```
- Frontend: http://localhost:5173
- WebSocket: ws://localhost:8080

### 2. Producción
- Frontend: tu-dominio-frontend.vercel.app
- WebSocket: wss://tu-proyecto.railway.app

### 3. Test de Conexión
1. Abrir el chat en tu app
2. Intentar unirse con un usuario
3. Verificar que aparezca "Conectado" (punto verde)
4. Enviar un mensaje de prueba

---

## 🐛 Troubleshooting

### El chat no conecta:
1. **Verificar URL**: Asegúrate que la URL sea correcta
2. **Verificar Railway**: Ve a Railway dashboard → Logs
3. **Verificar variables**: Revisa que `VITE_WEBSOCKET_URL` esté configurada
4. **Probar localmente**: `npm run dev:full` para verificar que funciona local

### Railway no despliega:
1. **Verificar package.json**: Debe tener `"start": "node server/websocket-server.js"`
2. **Verificar archivos**: `server/websocket-server.js` debe existir
3. **Ver logs**: Railway dashboard → Deployments → View Logs

### Variables de entorno no funcionan:
1. **Vite requiere prefijo**: Debe ser `VITE_WEBSOCKET_URL`
2. **Rebuild**: Después de cambiar variables, rebuild la app
3. **Verificar en browser**: `console.log(import.meta.env.VITE_WEBSOCKET_URL)`

---

## 💡 Tips Adicionales

### Para Railway:
- **Logs en tiempo real**: Railway dashboard → Deployments → View Logs
- **Variables de entorno**: Settings → Variables
- **Custom domain**: Settings → Domains → Add Custom Domain
- **Scaling**: Settings → Resources (si necesitas más poder)

### Para el Chat:
- **Testing**: Abre múltiples pestañas para simular varios usuarios
- **Debugging**: Abre DevTools → Console para ver logs del WebSocket
- **Performance**: El servidor limita a 30 mensajes/minuto por usuario

---

## 🎉 ¡Listo!

Una vez configurado, tendrás:
- ✅ Chat en tiempo real
- ✅ Múltiples departamentos
- ✅ Reconexión automática
- ✅ Indicadores de estado
- ✅ Lista de usuarios conectados
- ✅ Historial de mensajes
- ✅ SSL/TLS seguro (WSS)

**¿Necesitas ayuda con algún paso específico?** ¡Pregúntame!