// 1. Inicialización de Supabase
// Asegúrate de importar el script de Supabase en tu HTML antes de este archivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const adminSupabaseUrl = 'https://db.rbgct.cloud';
const adminSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.ocgMZIiSZB41nEuUq91QsxVCjPVrGOmz6ptHuYTwJ6U';
const supabaseAdmin = window.supabase.createClient(adminSupabaseUrl, adminSupabaseKey);

let solicitudesData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDirectorio();
    await cargarSolicitudesCertificados();

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
                <td class="py-4 px-6"><div class="text-sm text-corporate-blue font-medium">${emp.area || '-'}</div><div class="text-xs text-gray-500">${emp.cargo || '-'}</div></td>
                <td class="py-4 px-6 text-sm text-gray-600">${emp.fecha_ingreso || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

async function cargarSolicitudesCertificados() {
    try {
        const { data, error } = await supabaseAdmin
            .from('solicitudes_certificados')
            .select('id, tipo_certificado, fecha_solicitud, empleados (nombre_completo, documento, cargo, salario, fecha_ingreso)')
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
                    <button onclick="generarYEnviarPDF('${sol.id}')" class="bg-corporate-blue hover:bg-blue-800 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition">
                        <i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Generar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

// LA GENERACIÓN DEL PDF
window.generarYEnviarPDF = async function(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud || !solicitud.empleados) return alert("Error: Datos no encontrados.");

    const emp = solicitud.empleados;
    
    // Validaciones de datos para evitar que jsPDF falle
    const salario = emp.salario ? Number(emp.salario) : 0;
    const sueldoFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(salario);
    const fechaFormat = emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'fecha no registrada';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(0, 24, 113); 
    doc.text('Russell Bedford Colombia', 105, 30, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); 
    doc.text('CERTIFICA QUE:', 105, 50, { align: 'center' });

    doc.setFontSize(12);
    const textoCertificado = `El (la) señor(a) ${emp.nombre_completo}, identificado(a) con Cédula de Ciudadanía No. ${emp.documento}, se encuentra laborando en nuestra firma desde el ${fechaFormat}, desempeñando el cargo de ${emp.cargo || 'empleado'} y devengando una asignación salarial mensual de ${sueldoFormat}.`;
    
    const lineas = doc.splitTextToSize(textoCertificado, 170);
    doc.text(lineas, 20, 70);

    doc.text('Para constancia, se firma la presente certificación a solicitud del interesado.', 20, 110);
    doc.text('Atentamente,', 20, 140);
    doc.setFont(undefined, 'bold');
    doc.text('Departamento de Gestión Humana', 20, 150);

    doc.save(`Certificado_${emp.nombre_completo.replace(/\s+/g, '_')}.pdf`);

    // Actualizar estado en Supabase
    try {
        await supabaseAdmin.from('solicitudes_certificados').update({ estado: 'generado' }).eq('id', solicitudId);
        cargarSolicitudesCertificados();
    } catch (err) {
        console.error("Error actualizando DB:", err);
    }
}