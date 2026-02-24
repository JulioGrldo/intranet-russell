document.addEventListener('DOMContentLoaded', () => {
    const formCertificado = document.getElementById('form-certificado');
    
    if (formCertificado) {
        formCertificado.addEventListener('submit', solicitarCertificado);
    }
});

async function solicitarCertificado(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

    const documento = document.getElementById('empDocumento').value.trim();

    try {
        // 1. Verificar si el empleado existe en la base de datos buscando por su documento
        const { data: empleado, error: empError } = await window.supabaseClient
            .from('empleados')
            .select('id, nombre_completo')
            .eq('documento', documento)
            .single(); // Esperamos encontrar solo 1

        if (empError || !empleado) {
            alert('No encontramos un empleado registrado con ese número de documento. Por favor, comunícate con Gestión Humana.');
            return;
        }

        // 2. Si existe, insertamos la solicitud en la base de datos vinculada a su ID
        const { error: insertError } = await window.supabaseClient
            .from('solicitudes_certificados')
            .insert([{
                empleado_id: empleado.id,
                tipo_certificado: 'laboral',
                estado: 'pendiente'
            }]);

        if (insertError) throw insertError;

        // 3. Éxito
        alert(`¡Listo, ${empleado.nombre_completo}! Tu solicitud ha sido enviada a Gestión Humana.`);
        e.target.reset();

    } catch (error) {
        console.error('Error procesando la solicitud:', error);
        alert('Ocurrió un error de conexión. Inténtalo de nuevo más tarde.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}