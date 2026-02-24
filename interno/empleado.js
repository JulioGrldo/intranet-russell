document.addEventListener('DOMContentLoaded', () => {
    // 1. Saludar al usuario
    const nombre = localStorage.getItem('empleado_nombre') || 'Empleado';
    document.getElementById('userName').innerText = nombre.split(' ')[0]; // Solo el primer nombre

    // 2. Si es admin, mostrarle botón para volver a su panel
    const rol = localStorage.getItem('empleado_rol');
    if(rol === 'admin') {
        const nav = document.getElementById('nav-actions');
        nav.insertAdjacentHTML('afterbegin', `<a href="../admin/panel.html" class="text-corporate-blue hover:underline font-medium text-sm flex items-center gap-2 mr-4"><i class="fa-solid fa-shield-halved"></i> Panel Admin</a>`);
    }

    // 3. Cerrar sesión
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if(window.supabaseClient) await window.supabaseClient.auth.signOut();
        localStorage.clear();
        window.location.href = '../index.html';
    });

    // 4. Solicitar Certificado
    const btnPedir = document.getElementById('btn-pedir-certificado');
    if (btnPedir) {
        btnPedir.addEventListener('click', async (e) => {
            const btn = e.target;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

            try {
                const empId = localStorage.getItem('empleado_id');
                if(!empId) throw new Error("No hay ID");

                const { error: insertError } = await window.supabaseClient
                    .from('solicitudes_certificados')
                    .insert([{
                        empleado_id: empId,
                        tipo_certificado: 'laboral',
                        estado: 'pendiente'
                    }]);

                if (insertError) throw insertError;

                alert(`¡Listo! Tu solicitud ha sido enviada a Gestión Humana.`);

            } catch (error) {
                console.error('Error:', error);
                alert('Ocurrió un error. Inténtalo de nuevo más tarde.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});