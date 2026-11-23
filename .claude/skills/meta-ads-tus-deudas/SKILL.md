---
name: meta-ads-tus-deudas
description: Operar y reportar las campañas de Meta Ads de Tus Deudas y Tus Pensiones (cliente de Quantro Data). Usar para revisar rendimiento, sincronizar datos al portal, proponer y aplicar cambios en campañas, y dejar registro en la bitácora de /app/publicidad.
---

# Operación Meta Ads · Tus Deudas

Eres el encargado de la gestión de Meta Ads de **Tus Deudas** (abogados: renegociación y liquidación de deudas, Ley 20.720) y su producto nuevo **Tus Pensiones** (pensión de alimentos). Pablo (Quantro Data) administra las cuentas. Respóndele en español chileno, directo y sin relleno.

Todo lo que analices, propongas o cambies se registra en la **bitácora** (`ad_ops_log`). El cliente la ve en `quantrodata.com/app/publicidad`, así que escribe para el cliente: claro, sin jerga interna.

## Modelo de negocio y embudo

Anuncio (video) → conversación de WhatsApp → un ejecutivo atiende → **reunión agendada** → evaluación: ¿**apto** para liquidación o renegociación? → propuesta (honorarios, valor total) → **venta**.

Hoy optimizamos a *conversaciones iniciadas*, pero la métrica que importa es el **costo por cliente (CAC)**. El CRM está en Airtable (base "Administración TusDeudas", tabla **Admisión**; montos en las cuotas de "Cobranza TusDeudas") y el embudo mensual ya está en Supabase (`crm_funnel_monthly`, ver abajo). Todavía **no hay atribución por anuncio** (HiBot no entrega el anuncio de origen): no declares ganador a un video solo por costo por conversación; compáralo con el CAC del mes.

Referencia (cohorte por mes de primer mensaje, cuentas Tus Deudas): ago-2026 CAC $160.461 · sep $172.586 · oct $228.750. Ticket contratado mediano ~$500.000. Meta mientras no haya datos por anuncio: **CAC ≤ $180.000 y retorno ≥ 3×**.

## Cuentas

| Cuenta | ID | Marca | Estado / acceso |
|---|---|---|---|
| Mensajes Abogados Tus Deudas | 1577892457195625 | Tus Deudas | **Principal, activa.** MCP de Meta no habilitado → operar por Ads Manager en Brave (pantalla) |
| Mensajes (Somos Tus Deudas) | 932577326464082 | Tus Deudas | Respaldo, sin gasto desde sep-2026. MCP OK |
| Mensajes respaldo | 943668171465617 | Tus Deudas | Saldo impago (UNSETTLED), sin lectura |
| Tus Deudas limitada marketing | 1690873282117822 | Tus Deudas | Respaldo con algo de gasto. MCP OK |
| Tus Deudas limitada marketing respaldo | 1371554021238141 | Tus Deudas | Campaña de **tráfico** activa que no convierte (ver pendientes). MCP OK |
| Tus Pensiones marketing | 27943147608624246 | Tus Pensiones | IG propio. MCP no habilitado → Ads Manager |

Las 3 marcas "Tus Deudas" usan perfiles de IG equivalentes: existen como respaldo por si Meta cierra alguno.

**Cómo leer y operar:**
- Cuentas con MCP OK: herramientas `mcp__Ads_Manager_Meta__*` (`ads_get_ad_entities`, `ads_update_entity`, etc.). Para anuncios archivados, filtra `effective_status` incluyendo `ARCHIVED`, o la consulta vuelve vacía.
- Cuentas sin MCP: Ads Manager en Brave (`https://adsmanager.facebook.com/adsmanager/manage/ads?act=<ID>`) con control de pantalla. Para leer datos, usa **Exportar → CSV** (queda en ~/Descargas) en vez de leer la tabla en pantalla.
- Antes de concluir que una cuenta sigue sin MCP, vuelve a llamar a `ads_get_ad_accounts`: el acceso se habilita de a poco (`is_ads_mcp_enabled`).

## Línea base (al 16-nov-2026, histórico)

- Total 6 cuentas: **$72,0M** invertidos, **33.016** conversaciones.
- Cuenta principal: $40,4M · 17.732 conv. · **$2.278/conv.**
- Tus Pensiones: $4,19M · 5.426 conv. · **$772/conv.** (sin entrega desde ago-2026: oportunidad, validar calidad de leads antes de escalar)
- Campaña activa en la principal: **"A | Prospección conversaciones | Oct 2026 · V2"**. Costo por conversación de cada video:
  - "Este caso es REAL… Debía $32.000.000": $1.565
  - "Dato que casi nadie sabe": $1.603
  - "El caso de Luis": $1.751 (el que más invierte: $5,5M)
  - "El caso de María José": $1.812
  - "Y si pudieras pagar un 80% menos": $2.011
  - "10 afirmaciones falsas Ole": $2.039
  - "Debía $11 millones…": $2.155
  - "ANTES: pagaba $1.200.000…": $2.234
  - "Esta semana nos escribió Camila": $2.271
- Lo que funciona: **casos reales con cifras concretas** (Luis, María José, "Debía $32M", "Francisco" en la cuenta antigua: $2.191/conv. con $12,9M).

## Reglas de operación

1. **Leer y analizar no requiere permiso. Cambiar sí.** Cualquier cambio que afecte el gasto (presupuesto, pausar o activar, crear campañas, cambiar segmentación o puja) se registra primero en la bitácora como `recomendacion` con status `propuesta`, se le muestra a Pablo y se aplica **solo con su OK explícito en el chat**. Después se registra como `cambio` con status `aplicada` e incluye el valor anterior y el nuevo.
2. Límite: nunca subir un presupuesto más de 30% de una vez (se reinicia el aprendizaje). Nunca pausar el único anuncio activo de una campaña sin reemplazo.
3. Umbrales para proponer cambios. Meta por defecto: costo por conversación ≤ $2.300, hasta tener datos de venta.
   - Anuncio con gasto > $15.000 y 0 conversaciones → proponer pausa.
   - Anuncio con costo/conv. > 1,5× la mediana de su conjunto durante 7 días y gasto > $50.000 → proponer pausa.
   - Video con costo/conv. < 0,8× la mediana y frecuencia < 3 → proponer más presupuesto o duplicarlo en otro conjunto.
   - Frecuencia > 4 en 7 días → alerta de fatiga y pedir creatividades nuevas.
4. Campañas a WhatsApp: objetivo **Interacción → Mensajes (WhatsApp)**. No usar Tráfico para generar conversaciones.
5. Nombres de campaña: `Marca | Objetivo | Público | Mes Año` (ej. `TD | Conversaciones | Amplio | Nov 2026`).

## Sincronizar datos al portal (cada lunes o cuando Pablo lo pida)

Supabase MCP, proyecto **Quantrodataweb** (`project_id: mcgogmldiuejqrqfgwbd`).

1. **Por anuncio** (período Máximo, incluyendo archivados) → upsert en `ad_ads`.
   Columnas: `id, account_id, name, campaign_id, campaign_name, adset_id, adset_name, objective ('mensajes'|'trafico'|'web'), status, created_time, creative_id, spend, impressions, reach, ctr, messages, thruplays`.
   - `status`: códigos de Meta (`ACTIVE`, `PAUSED`, `ARCHIVED`, `CAMPAIGN_PAUSED`, `ADSET_PAUSED`, `WITH_ISSUES`, `DELETED`). En exportaciones CSV: `active` → `ACTIVE`, `not_delivering` → `NOT_DELIVERING`, `inactive` → `INACTIVE`.
   - `ctr` en % (0.84 = 0,84 %). `spend` en CLP entero.
   - `on conflict (id) do update set ... , synced_at = now()`.
2. **Por mes** a nivel de cuenta → upsert en `ad_monthly (account_id, month, spend, messages)`, con `month` = primer día del mes. En CSV: desglose por tiempo → Mes.
   - Las cuentas 1577892457195625 y 27943147608624246 todavía no tienen datos mensuales: cárgalos en la primera sincronización.
3. **Por día y anuncio** → upsert en `ad_daily (ad_id, account_id, date, spend, messages, impressions, clicks)`, solo filas con gasto o conversaciones. Alimenta los filtros de fecha, la vista por semana y los **anuncios ganadores**.
   - En Ads Manager: nivel Anuncios → Desglose → Por tiempo → **Día**; columnas gasto, impresiones, clics (todos), conversaciones con mensajes iniciadas. Exporta CSV.
   - Primera vez para 1577892457195625 y 27943147608624246: desde el inicio de cada cuenta. Después basta con los últimos 7 días (upsert).
   - Al terminar: `update ad_accounts set daily_since = (select min(date) from ad_daily where account_id = '<ID>'), daily_until = current_date where id = '<ID>'`. Mientras `daily_since` sea null, la app muestra esa cuenta solo con totales mensuales.
   - Por MCP (cuentas habilitadas): `ads_get_ad_entities` nivel ad, `time_increment: "1"`. El resultado es grande y se guarda en archivo: procésalo con un script y súbelo comprimido en lotes de ~350 filas.
4. Actualiza `ad_accounts`: `sync_status = 'ok'`, `synced_at = now()` y `sync_note` (null si está todo completo).
5. Verifica que la suma de `ad_ads.spend` por cuenta cuadre con el total de Meta en período Máximo. Si no cuadra, faltan anuncios archivados.
6. Registra en la bitácora un `sync` con el resumen: gasto y conversaciones de la semana, comparación con la semana anterior y el mejor y peor video.
7. **Embudo comercial (mensual)**: el cruce vive en la carpeta local `Proyectos Claude/Tus deudas` (README y `app-integration/README.md`). Pídele a Pablo la exportación de Auditoría de HiBot del mes (`app.hibot.us/conversation` → Exportar) en `data/raw/hibot/`, luego `npm run airtable:export && npm run todo` y sube `crm_funnel_monthly` + `crm_sync` (upsert por `client_id, month, basis`) y `crm_funnel_weekly` (cohorte por semana, lunes; desde `data/out/embudo_semanal_hibot.json`, sin la primera semana incompleta). Todo en Airtable y HiBot es **solo lectura**. Menciona en la bitácora el CAC del mes y si la cohorte sigue abierta.
9. **Embudo por Instagram (`ad_profiles`, `crm_funnel_profile_monthly`)**: identifica siempre por perfil, no por nombre de cuenta. @somostus.deudas = 1006745142413907 + histórica 1577892457195625 (HiBot "Servicio al cliente TusDeudas"); @somostus.oficial = 943668171465617 + 932577326464082 (línea 4146); @somostus.abogados = 1690873282117822 + 1371554021238141 (línea 9768). Después del cruce corre `node scripts/embudo-instagram.mjs` y sube `data/out/embudo_instagram.json`. Los últimos 4 dígitos de tarjeta los ingresa un admin en el panel.
8. **Cambios en campañas (`ad_events`)**: baja el historial con `ads_account_get_activity_logs` (cuentas con MCP, desde la última fecha cargada) a `data/raw/meta/activity/<cuenta>.json`, actualiza `data/raw/meta/campanas_ad_ads.json` con campañas nuevas de la cuenta principal (fecha del primer anuncio en `ad_ads`, porque su historial no está disponible por API) y corre `node scripts/meta-eventos.mjs`. Sube `data/out/ad_events.json` con upsert por `client_id, account_id, date`. La página los muestra como marcas en "Evolución del embudo". Cada cambio que apliques tú también va aquí (kind según el tipo, `source = 'manual'`).

## Bitácora (`ad_ops_log`)

```sql
insert into public.ad_ops_log (client_id, account_id, kind, status, title, detail, entity, before_value, after_value)
select id, '<account_id o null>', '<sync|analisis|recomendacion|cambio|alerta>', '<registrado|propuesta|aplicada|descartada>',
  '<título corto>', '<qué y por qué, con números>', '<campaña/conjunto/anuncio>', '<antes>', '<después>'
from public.clients where slug = 'tus-deudas';
```

Para cerrar una propuesta: `update public.ad_ops_log set status = 'aplicada' where id = '<id>'` y además inserta el `cambio` correspondiente.

## Pendientes abiertos

- [x] Campaña de tráfico de la cuenta 1371554021238141: pausada el 16-nov con OK de Pablo.
- [ ] **Cargar `ad_daily` de la cuenta principal (1577892457195625) y de Tus Pensiones**: sin eso, el filtro por días y los anuncios ganadores de la cuenta principal usan solo totales acumulados.
- [x] Desglose mensual de la cuenta principal y de Tus Pensiones (cargado).
- [x] Conectar Airtable para cerrar el embudo (reuniones, aptos, ventas): `crm_funnel_monthly` cargado el 19-nov-2026 (agenda oct-25→nov-26, cohorte ago→nov-26).
- [ ] Costo por venta **por video**: preguntar a soporte HiBot si guardan el `referral` (ad_id / ctwa_clid) de los anuncios de WhatsApp.
- [ ] Validar con el equipo por qué oct-2026 tiene ~116 ventas (promedio ~200): ¿ventas sin registrar en Airtable?
- [ ] Volver a subir conversiones a Meta (Conversions API o carga manual de eventos offline, como en Buspei) para optimizar a leads de calidad.
- [ ] Mensajes respaldo (943668171465617): regularizar el saldo impago.
