let currentVacanteId = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarVacantes();
    const form = document.getElementById('applicationForm');
    if(form) form.addEventListener('submit', enviarPostulacion);
});

async function cargarVacantes() {
    const container = document.getElementById('vacanciesContainer');
    try {
        // Usamos el cliente global
        const { data, error } = await window.supabaseClient
            .from('vacantes')
            .select('*')
            .eq('estado', 'abierta')
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No hay vacantes abiertas en este momento.</p>';
            return;
        }

        data.forEach(vacante => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm hover:shadow-md p-6 border border-gray-100 transition-all';
            card.innerHTML = `
                <h3 class="text-xl font-bold text-[#001871] mb-2">${vacante.titulo}</h3>
                <span class="inline-block bg-blue-50 text-[#001871] text-xs px-3 py-1 rounded-full font-semibold mb-4">${vacante.area_solicitante}</span>
                <p class="text-gray-600 mb-6 text-sm line-clamp-3">${vacante.descripcion}</p>
                <button onclick="abrirModal('${vacante.id}')" class="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition-colors w-full sm:w-auto shadow-sm">
                    Postularse
                </button>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error cargando vacantes:', err);
    }
}

window.abrirModal = function(vacanteId) {
    currentVacanteId = vacanteId;
    document.getElementById('applyModal').classList.remove('hidden');
}

async function enviarPostulacion(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Procesando...';

    const nombre = document.getElementById('applicantName').value;
    const correo = document.getElementById('applicantEmail').value;
    const telefono = document.getElementById('applicantPhone').value;
    const file = document.getElementById('applicantCV').files[0];

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${nombre.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
        const filePath = `postulaciones/${fileName}`;

        const { error: uploadError } = await window.supabaseClient.storage
            .from('curriculums')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('curriculums')
            .getPublicUrl(filePath);

        const { error: insertError } = await window.supabaseClient
            .from('postulaciones')
            .insert([{ vacante_id: currentVacanteId, nombre_candidato: nombre, correo, telefono, url_cv: publicUrl }]);

        if (insertError) throw insertError;

        alert('¡Tu postulación fue recibida con éxito!');
        document.getElementById('applyModal').classList.add('hidden');
        e.target.reset();

    } catch (err) {
        console.error('Error:', err);
        alert('Hubo un error procesando tu solicitud.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Enviar Aplicación';
    }
}