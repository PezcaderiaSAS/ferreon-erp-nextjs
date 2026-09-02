# Git en Windows: Manejo de Certificados SSL (Schannel)

Cuando un comando de Git (`git pull`, `git fetch`, `git clone`, `git push`) falle en entorno Windows con el error:
`schannel: SEC_E_UNTRUSTED_ROOT (0x80090325) - La cadena de certificación fue emitida por una entidad en la que no se confía.`

## Reglas Obligatorias

1. **Reintento Quirúrgico:** DEBE reintentarse inmediatamente el comando inyectando la configuración puntual:
   ```bash
   git -c http.sslVerify=false <comando>
   ```
   *Ejemplo:* `git -c http.sslVerify=false pull`

2. **No Alterar Configuración Global:** NO modificar la configuración global de Git (`git config --global http.sslVerify false`) a menos que el usuario lo solicite expresamente, para no degradar la seguridad del sistema en otros repositorios.
