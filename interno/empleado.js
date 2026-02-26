// ==========================================
// FUNCIÓN DE NOTIFICACIONES PROFESIONALES (TOASTS)
// ==========================================
function mostrarNotificacion(mensaje, tipo = 'exito') {
    const toast = document.createElement('div');
    
    // Colores e íconos dependiendo de si es éxito o error
    const colorBg = tipo === 'exito' ? 'bg-green-600' : 'bg-red-500';
    const icono = tipo === 'exito' ? 'fa-circle-check' : 'fa-circle-exclamation';

    // Clases de Tailwind para diseño y animación suave
    toast.className = `fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 translate-y-20 opacity-0 z-[100] ${colorBg} text-white font-medium text-sm`;
    toast.innerHTML = `<i class="fa-solid ${icono} text-xl"></i> <span>${mensaje}</span>`;
    
    document.body.appendChild(toast);
    
    // Disparar animación de entrada (aparecer hacia arriba)
    setTimeout(() => toast.classList.remove('translate-y-20', 'opacity-0'), 10);

    // Disparar animación de salida y destruir el elemento después de 4 segundos
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// ==========================================
// LÓGICA PRINCIPAL DEL PORTAL
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Saludar al usuario
    const nombreCompleto = localStorage.getItem('empleado_nombre') || 'Empleado';
    const primerNombre = nombreCompleto.split(' ')[0];
    document.getElementById('userName').innerText = primerNombre;
    document.getElementById('profileName').innerText = nombreCompleto;
    document.getElementById('profileDoc').innerText = `C.C. ${localStorage.getItem('empleado_documento') || '---'}`;

    // 2. Botón Admin
    const rol = localStorage.getItem('empleado_rol');
    if(rol === 'admin') {
        const nav = document.getElementById('nav-actions');
        nav.insertAdjacentHTML('afterbegin', `<a href="../admin/panel.html" class="bg-blue-50 text-corporate-blue hover:bg-blue-100 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 mr-2 transition"><i class="fa-solid fa-shield-halved"></i> Panel Admin</a>`);
    }

    // 3. Obtener datos de Supabase
    const empId = localStorage.getItem('empleado_id');
    if (empId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('empleados')
                .select('cargo, area, correo_corporativo, fecha_ingreso')
                .eq('id', empId)
                .single();

            if (!error && data) {
                document.getElementById('userCargo').innerText = data.cargo || 'Asignación Pendiente';
                document.getElementById('userArea').innerText = data.area || 'Russell Bedford';
                document.getElementById('profileEmail').innerText = data.correo_corporativo || 'Sin correo';
                if(data.fecha_ingreso) {
                    const fecha = new Date(data.fecha_ingreso);
                    document.getElementById('profileDate').innerText = fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'short' });
                }
            }
        } catch (err) {
            console.error("No se pudo cargar la data", err);
        }
    }

    // 4. Cerrar sesión
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if(window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.clear();
        window.location.href = '../index.html';
    });

    // 5. LÓGICA DE SOLICITUD DE CERTIFICADO CON MODAL
    const btnPedir = document.getElementById('btn-pedir-certificado');
    const modalCert = document.getElementById('modal-opciones-cert');
    
    window.cerrarModalCert = () => modalCert.classList.add('hidden');

    if (btnPedir) {
        btnPedir.addEventListener('click', () => {
            document.getElementById('cert-dirigido').value = 'A QUIEN INTERESE';
            document.getElementById('cert-con-cargo').checked = true;
            document.getElementById('cert-con-sueldo').checked = true;
            modalCert.classList.remove('hidden');
        });
    }

    document.getElementById('btn-confirmar-cert').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        const opciones = {
            dirigido: document.getElementById('cert-dirigido').value.trim() || 'A QUIEN INTERESE',
            cargo: document.getElementById('cert-con-cargo').checked,
            sueldo: document.getElementById('cert-con-sueldo').checked
        };

        try {
            if(!empId) throw new Error("No hay ID de empleado");

            const { error: insertError } = await window.supabaseClient
                .from('solicitudes_certificados')
                .insert([{
                    empleado_id: empId,
                    tipo_certificado: 'laboral',
                    estado: 'pendiente',
                    comentarios_rrhh: JSON.stringify(opciones)
                }]);

            if (insertError) throw insertError;

            // AQUÍ LLAMAMOS A LA NOTIFICACIÓN MODERNA EN VEZ DEL ALERT
            mostrarNotificacion('¡Solicitud enviada a RRHH con éxito!', 'exito');
            cerrarModalCert();

        } catch (error) {
            console.error('Error:', error);
            // NOTIFICACIÓN DE ERROR
            mostrarNotificacion('Error de conexión. Inténtalo de nuevo.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Enviar Solicitud a RRHH';
        }
    });
});