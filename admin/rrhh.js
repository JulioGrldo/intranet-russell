// 1. Inicialización de Supabase
// Asegúrate de importar el script de Supabase en tu HTML antes de este archivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const adminSupabaseUrl = 'https://db.rbgct.cloud';
const adminSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.ocgMZIiSZB41nEuUq91QsxVCjPVrGOmz6ptHuYTwJ6U';
const supabaseAdmin = window.supabase.createClient(adminSupabaseUrl, adminSupabaseKey);

let solicitudesData = [];
let solicitudActualParaPDF = null;

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDirectorio();
    await cargarSolicitudesCertificados();
    await cargarPostulaciones(); // ¡Tus postulaciones siguen aquí intactas!

    // Lógica para Cerrar Sesión
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if(window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.clear();
        window.location.href = '../index.html';
    });
});

async function cargarDirectorio() {
    try {
        const { data, error } = await supabaseAdmin.from('empleados').select('*').order('nombre_completo', { ascending: true });
        if (error) throw error;
        
        const tbody = document.querySelector('#tabla-personal tbody');
        tbody.innerHTML = ''; 

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">No hay empleados registrados.</td></tr>';
            return;
        }

        data.forEach(emp => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
            tr.innerHTML = `
                <td class="py-4 px-6 font-mono text-sm text-gray-600">${emp.documento}</td>
                <td class="py-4 px-6 font-bold text-gray-800">${emp.nombre_completo}</td>
                <td class="py-4 px-6"><div class="text-sm text-[#001871] font-medium">${emp.area || emp.division || '-'}</div><div class="text-xs text-gray-500">${emp.cargo || '-'}</div></td>
                <td class="py-4 px-6 text-sm text-gray-600">${emp.fecha_ingreso || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

async function cargarPostulaciones() {
    try {
        const { data, error } = await supabaseAdmin
            .from('postulaciones')
            .select('id, nombre_candidato, correo, telefono, url_cv, vacantes(titulo)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.querySelector('#tabla-postulaciones tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">Aún no hay postulaciones recibidas.</td></tr>';
            return;
        }

        data.forEach(post => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
            const tituloVacante = post.vacantes ? post.vacantes.titulo : 'Vacante cerrada/eliminada';

            tr.innerHTML = `
                <td class="py-4 px-6 font-bold text-gray-800">${post.nombre_candidato}</td>
                <td class="py-4 px-6">
                    <div class="text-sm text-gray-600"><i class="fa-solid fa-envelope mr-1 text-gray-400"></i> ${post.correo}</div>
                    <div class="text-sm text-gray-600 mt-1"><i class="fa-solid fa-phone mr-1 text-gray-400"></i> ${post.telefono || 'No registrado'}</div>
                </td>
                <td class="py-4 px-6">
                    <span class="px-3 py-1 bg-orange-50 text-[#F26822] border border-orange-100 rounded-lg text-xs font-bold uppercase tracking-wide">
                        ${tituloVacante}
                    </span>
                </td>
                <td class="py-4 px-6 text-right">
                    <a href="${post.url_cv}" target="_blank" class="inline-flex items-center justify-center bg-gray-50 hover:bg-[#001871] text-[#001871] hover:text-white font-medium text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-transparent transition-colors">
                        <i class="fa-solid fa-file-pdf mr-2 text-red-500 group-hover:text-white"></i> Ver CV
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error cargando postulaciones:', err);
    }
}

async function cargarSolicitudesCertificados() {
    try {
        const { data, error } = await supabaseAdmin
            .from('solicitudes_certificados')
            .select('id, tipo_certificado, fecha_solicitud, comentarios_rrhh, empleados (*)') 
            .eq('estado', 'pendiente');

        if (error) throw error;
        solicitudesData = data;
        
        const tbody = document.querySelector('#tabla-solicitudes tbody');
        const badge = document.getElementById('badge-certificados');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-6 text-gray-500">Bandeja limpia. No hay solicitudes pendientes.</td></tr>';
            badge.style.display = 'none';
            return;
        }

        badge.innerText = data.length;
        badge.style.display = 'flex';

        data.forEach(sol => {
            const emp = sol.empleados;
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
            tr.innerHTML = `
                <td class="py-4 px-6"><div class="font-bold text-gray-800">${emp.nombre_completo}</div><div class="text-xs text-gray-500">C.C. ${emp.documento}</div></td>
                <td class="py-4 px-6"><span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">${sol.tipo_certificado.toUpperCase()}</span></td>
                <td class="py-4 px-6 text-right">
                    <button onclick="previsualizarCertificado('${sol.id}')" class="bg-[#001871] hover:bg-blue-900 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition">
                        <i class="fa-solid fa-eye mr-2"></i> Previsualizar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

// ==========================================
// CREADOR DE TEXTO Y GENERADOR DE PDF
// ==========================================

window.previsualizarCertificado = function(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud || !solicitud.empleados) return alert("Error: Datos no encontrados.");
    
    solicitudActualParaPDF = solicitud;
    const emp = solicitud.empleados;

    // 1. Leer las opciones del empleado guardadas en el JSON
    let opciones = { dirigido: 'A QUIEN INTERESE', sueldo: true, cargo: true };
    try {
        if(solicitud.comentarios_rrhh) opciones = JSON.parse(solicitud.comentarios_rrhh);
    } catch(e) { console.warn("Usando opciones por defecto"); }

    // 2. Formatear números y fechas
    const salario = emp.sueldo || emp.salario || 0;
    const sueldoFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(salario);
    
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    let fechaIngresoTxt = '[FECHA NO REGISTRADA]';
    if(emp.fecha_ingreso) {
        const d = new Date(emp.fecha_ingreso);
        d.setDate(d.getDate() + 1); // Compensar zona horaria si es necesario
        fechaIngresoTxt = `${String(d.getDate()).padStart(2, '0')} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    }

    const hoy = new Date();
    const fechaHoyTxt = `${String(hoy.getDate()).padStart(2, '0')} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

    const expedicion = emp.lugar_expedicion_cedula ? ` de ${emp.lugar_expedicion_cedula}` : '';
    const empresa = emp.razon_social || emp.division || 'GLT GESTIÓN LEGAL Y TRIBUTARIA S.A.S';

    // 3. ARMAMOS TU REDACCIÓN EXACTA
    let textoBase = `Certificamos que el señor(a) <strong class="uppercase">${emp.nombre_completo}</strong> identificado con cédula de ciudadanía No ${new Intl.NumberFormat('es-CO').format(emp.documento)}${expedicion}, labora en <strong class="uppercase">${empresa}</strong> con Nit. 900930391-1, desde el ${fechaIngresoTxt}, con contrato a término indefinido`;

    // Respetar las opciones del empleado
    if (opciones.cargo && emp.cargo) {
        textoBase += `, desempeñando el cargo de <strong class="uppercase">${emp.cargo}</strong>`;
    }
    if (opciones.sueldo && salario > 0) {
        textoBase += ` y devengando un salario mensual de <strong>${sueldoFormat}</strong>`;
    }
    textoBase += `.`;

    // 4. Inyectar datos en la plantilla oculta
    document.getElementById('cert-dirigido-text').innerText = opciones.dirigido;
    document.getElementById('cert-body-editable').innerHTML = textoBase;
    document.getElementById('cert-fecha-top').innerText = `Medellín, ${fechaHoyTxt}`;

    // 5. Clonar plantilla hacia el modal
    const canvas = document.getElementById('previewCanvas');
    canvas.innerHTML = ''; 
    const templateClone = document.getElementById('certificado-content').cloneNode(true);
    
    // Asignar ID nuevo para evitar conflictos y asegurar que sea editable
    templateClone.id = "cloned-cert-content";
    canvas.appendChild(templateClone);

    // 6. Mostrar el Modal
    document.getElementById('modalPreview').classList.remove('hidden');
}

window.cerrarPreview = function() {
    document.getElementById('modalPreview').classList.add('hidden');
    solicitudActualParaPDF = null;
}

window.descargarCertificado = async function() {
    if(!solicitudActualParaPDF) return;

    const btn = document.getElementById('btnDownloadFromPreview');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Generando...';

    const emp = solicitudActualParaPDF.empleados;
    // Seleccionamos el canvas visible en la pantalla
    const element = document.getElementById('cloned-cert-content');

    // Desactivamos temporalmente el contenteditable para que el PDF no salga con un cursor de texto dibujado
    const editableDiv = element.querySelector('#cert-body-editable');
    if (editableDiv) editableDiv.removeAttribute('contenteditable');

    const opt = {
        margin:       0,
        filename:     `Certificado_Laboral_${emp.nombre_completo.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'px', format: [794, 1123], orientation: 'portrait' } 
    };

    try {
        await html2pdf().set(opt).from(element).save();

        await supabaseAdmin.from('solicitudes_certificados')
            .update({ estado: 'generado' })
            .eq('id', solicitudActualParaPDF.id);
        
        cargarSolicitudesCertificados();
        cerrarPreview();

    } catch (err) {
        console.error("Error generando PDF:", err);
        alert("Ocurrió un error al crear el archivo. Revisa la consola.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}