// 1. Inicialización de Supabase
// Asegúrate de importar el script de Supabase en tu HTML antes de este archivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const supabaseUrl = 'http://72.60.165.161:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.ocgMZIiSZB41nEuUq91QsxVCjPVrGOmz6ptHuYTwJ6U';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variables globales para almacenar los datos temporales
let empleadosData = [];
let solicitudesData = [];

// Cuando cargue el panel, cargamos las bases de datos
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDirectorio();
    await cargarSolicitudesCertificados();
    // await cargarPostulaciones(); (Este lo agregamos después cuando terminemos el portal público)
});

/* =========================================================
   MÓDULO: DIRECTORIO DE PERSONAL (Tu lógica base OBGCT)
   ========================================================= */
async function cargarDirectorio() {
    try {
        const { data, error } = await supabase
            .from('empleados')
            .select('*')
            .order('nombre_completo', { ascending: true });

        if (error) throw error;
        empleadosData = data;
        renderizarTablaEmpleados(data);
    } catch (err) {
        console.error('Error cargando empleados:', err);
    }
}

function renderizarTablaEmpleados(empleados) {
    // Si tu tabla tiene un ID diferente en el HTML, ajústalo aquí
    const tbody = document.querySelector('#tab-personal tbody');
    tbody.innerHTML = ''; 

    if (empleados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-gray-500">No hay empleados registrados en la firma.</td></tr>';
        return;
    }

    empleados.forEach(emp => {
        // Formatear la fecha para que sea legible
        const fechaFormat = new Date(emp.fecha_ingreso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });

        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
        tr.innerHTML = `
            <td class="py-4 px-6 font-mono text-sm text-gray-600">${emp.documento || emp.id}</td>
            <td class="py-4 px-6 font-bold text-gray-800">${emp.nombre_completo}</td>
            <td class="py-4 px-6">
                <div class="text-sm font-medium text-corporate-blue">${emp.division}</div>
                <div class="text-xs text-gray-500">${emp.cargo}</div>
            </td>
            <td class="py-4 px-6 text-sm text-gray-600">${fechaFormat}</td>
            <td class="py-4 px-6 text-right">
                <button class="text-gray-400 hover:text-corporate-blue mx-2"><i class="fa-solid fa-pen"></i></button>
                <button class="text-gray-400 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* =========================================================
   MÓDULO: CERTIFICADOS Y GENERACIÓN CON jsPDF
   ========================================================= */
async function cargarSolicitudesCertificados() {
    try {
        // Supabase permite traer los datos de la solicitud y cruzarlos con los datos del empleado (Join)
        const { data, error } = await supabase
            .from('solicitudes_certificados')
            .select('id, tipo_certificado, fecha_solicitud, empleados (nombre_completo, documento, cargo, sueldo, fecha_ingreso)')
            .eq('estado', 'pendiente');

        if (error) throw error;
        solicitudesData = data;
        renderizarTablaSolicitudes(data);
    } catch (err) {
        console.error('Error cargando solicitudes:', err);
    }
}

function renderizarTablaSolicitudes(solicitudes) {
    const tbody = document.querySelector('#tab-certificados tbody');
    tbody.innerHTML = '';

    // Lógica para actualizar el globlito rojo de notificaciones en el Sidebar
    const badge = document.querySelector('#btn-certificados span');
    if (solicitudes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-500">No hay solicitudes de certificados pendientes.</td></tr>';
        if(badge) badge.style.display = 'none';
        return;
    }

    if(badge) {
        badge.innerText = solicitudes.length;
        badge.style.display = 'block';
    }

    solicitudes.forEach(sol => {
        const emp = sol.empleados;
        if(!emp) return;

        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-50 hover:bg-blue-50/50 transition';
        tr.innerHTML = `
            <td class="py-4 px-6">
                <div class="font-bold text-gray-800">${emp.nombre_completo}</div>
                <div class="text-xs text-gray-500">C.C. ${emp.documento}</div>
            </td>
            <td class="py-4 px-6"><span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">${sol.tipo_certificado.toUpperCase()}</span></td>
            <td class="py-4 px-6 text-sm text-gray-500">Pendiente</td>
            <td class="py-4 px-6 text-right">
                <button onclick="generarYEnviarPDF('${sol.id}')" class="bg-corporate-blue hover:bg-blue-800 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition flex items-center justify-end gap-2 ml-auto">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Generar Certificado
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ------------------------------------------------------------------
// LA MAGIA: ADAPTACIÓN DE TU FUNCIÓN BASE (app.js) PARA CREAR EL PDF
// ------------------------------------------------------------------
async function generarYEnviarPDF(solicitudId) {
    // 1. Buscamos en memoria los datos exactos del empleado que pidió este certificado
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud || !solicitud.empleados) return alert("Error: Datos del empleado no encontrados.");

    const emp = solicitud.empleados;

    // 2. Extraemos y formateamos la información del empleado
    const nombre = emp.nombre_completo;
    const cedula = emp.documento;
    const cargo = emp.cargo;
    const fechaFormat = new Date(emp.fecha_ingreso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const sueldoFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(emp.sueldo);

    // 3. Inicializamos jsPDF (Que ya cargamos vía CDN en el HTML)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 4. Maquetación del documento (Ajustado con tu identidad)
    doc.setFontSize(22);
    doc.setTextColor(0, 24, 113); // Tu azul #001871
    doc.text('Russell Bedford Colombia', 105, 30, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Negro para el texto normal
    doc.text('CERTIFICA QUE:', 105, 50, { align: 'center' });

    doc.setFontSize(12);
    const textoCertificado = `El (la) señor(a) ${nombre}, identificado(a) con Cédula de Ciudadanía No. ${cedula}, se encuentra laborando en nuestra firma desde el ${fechaFormat}, desempeñando el cargo de ${cargo} y devengando una asignación salarial mensual de ${sueldoFormat}.`;
    
    // Dividir el texto en líneas para que respete los márgenes de la hoja
    const lineas = doc.splitTextToSize(textoCertificado, 170);
    doc.text(lineas, 20, 70);

    doc.text('Para constancia, se firma la presente certificación a solicitud del interesado.', 20, 110);

    // Firma de pie de página
    doc.text('Atentamente,', 20, 140);
    doc.setFont(undefined, 'bold');
    doc.text('Departamento de Gestión Humana', 20, 150);
    doc.setFont(undefined, 'normal');
    doc.text('Russell Bedford', 20, 155);

    // 5. Descargar el archivo localmente para RRHH (o subirlo directo al storage)
    doc.save(`Certificado_${nombre.replace(/\s+/g, '_')}.pdf`);

    // 6. Actualizar el estado en la base de datos para que desaparezca de "Pendientes"
    try {
        await supabase
            .from('solicitudes_certificados')
            .update({ estado: 'generado' })
            .eq('id', solicitudId);
        
        // Recargar la tabla
        cargarSolicitudesCertificados();
    } catch (err) {
        console.error("Error al actualizar la solicitud en base de datos:", err);
    }
}