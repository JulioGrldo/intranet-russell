// Variables globales
let allVacantes = [];
let currentVacanteId = null;
let currentVacanteTitle = '';

// ==========================================
// 1. FUNCIONES PRINCIPALES (Deben ir arriba)
// ==========================================

function renderizarVacantes(vacancies) {
    const container = document.getElementById('jobs-container');
    container.innerHTML = '';

    if (vacancies.length === 0) {
        container.innerHTML = `
            <div class="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 mt-2">
                <i class="ph ph-magnifying-glass text-4xl text-slate-300 mb-3"></i>
                <h3 class="text-lg font-bold text-slate-600">No hay vacantes en esta área</h3>
                <p class="text-sm text-slate-400 mt-1">Intenta seleccionando otra categoría en los filtros.</p>
            </div>
        `;
        return;
    }

    // Dibujar Tarjetas
    vacancies.forEach(v => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-2xl border border-slate-100 hover:border-brand-primary/30 hover:shadow-lg transition-all group flex flex-col gap-4 cursor-pointer relative overflow-hidden';
        card.innerHTML = `
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-dark to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="flex justify-between items-start">
                <div>
                    <span class="inline-block px-3 py-1 bg-blue-50 text-brand-dark text-[10px] font-bold rounded-md mb-2 uppercase tracking-wider">${v.area_solicitante || 'General'}</span>
                    <h3 class="text-xl font-bold text-slate-800 leading-tight group-hover:text-brand-primary transition-colors">${v.titulo}</h3>
                </div>
                <div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-brand-dark group-hover:bg-orange-50 group-hover:text-brand-primary transition-colors">
                    <i class="ph ph-arrow-up-right text-xl"></i>
                </div>
            </div>
            <p class="text-sm text-slate-500 line-clamp-2 leading-relaxed flex-1">${v.descripcion}</p>
            <div class="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-3 border-t border-slate-50">
                <span class="flex items-center gap-1.5"><i class="ph ph-map-pin text-brand-teal text-base"></i> Medellín</span>
                <span class="flex items-center gap-1.5"><i class="ph ph-briefcase text-brand-teal text-base"></i> Tiempo Completo</span>
            </div>
        `;
        card.onclick = () => openVacantePreview(v.id);
        container.appendChild(card);
    });
}

function aplicarFiltro(filtro) {
    let filtradas = allVacantes;
    if (filtro !== 'Todas') {
        filtradas = allVacantes.filter(v => 
            v.area_solicitante && v.area_solicitante.toLowerCase().includes(filtro.toLowerCase())
        );
    }
    renderizarVacantes(filtradas);
}

async function cargarVacantes() {
    const container = document.getElementById('jobs-container');
    try {
        const { data, error } = await window.supabaseClient
            .from('vacantes')
            .select('*')
            .eq('estado', 'abierta')
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;
        allVacantes = data;
        aplicarFiltro('Todas');

    } catch (err) {
        console.error('Error cargando vacantes:', err);
        container.innerHTML = '<div class="text-center py-10 text-red-500 font-medium">Error conectando con el servidor. Intenta nuevamente.</div>';
    }
}

// ==========================================
// 2. INICIALIZACIÓN (Al cargar la página)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    cargarVacantes();

    // Lógica de los botones de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Reiniciar botones
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-brand-dark', 'text-white', 'shadow-sm');
                b.classList.add('text-slate-500', 'hover:bg-orange-50');
            });
            // Activar botón clicado
            e.target.classList.remove('text-slate-500', 'hover:bg-orange-50');
            e.target.classList.add('bg-brand-dark', 'text-white', 'shadow-sm');

            const filterValue = e.target.getAttribute('data-area-filter');
            aplicarFiltro(filterValue);
        });
    });
});

// ==========================================
// 3. CONTROL DE MODALES Y FORMULARIO
// ==========================================

window.openVacantePreview = function(id) {
    const vacante = allVacantes.find(v => v.id === id);
    if(!vacante) return;

    currentVacanteId = vacante.id;
    currentVacanteTitle = vacante.titulo;

    document.getElementById('vacante-preview-title').innerText = vacante.titulo;
    document.getElementById('vacante-preview-area').innerText = vacante.area_solicitante || 'General';
    document.getElementById('vacante-preview-descripcion').innerText = vacante.descripcion;

    document.getElementById('vacante-preview-modal').classList.remove('hidden');
}

window.closeVacantePreviewModal = function() {
    document.getElementById('vacante-preview-modal').classList.add('hidden');
}

window.applyFromPreview = function() {
    closeVacantePreviewModal();
    document.getElementById('modal-cargo').innerText = currentVacanteTitle;
    document.getElementById('application-modal').classList.remove('hidden');
}

window.closeModal = function() {
    document.getElementById('application-modal').classList.add('hidden');
    document.getElementById('apply-form').reset();
    document.getElementById('file-name').innerHTML = 'Máximo 5MB';
}

window.openTermsModal = function() {
    document.getElementById('terms-modal').classList.remove('hidden');
}

window.closeTermsModal = function() {
    document.getElementById('terms-modal').classList.add('hidden');
}

window.updateFileName = function(input) {
    const display = document.getElementById('file-name');
    if (input.files.length > 0) {
        display.innerHTML = `<span class="text-green-600 font-bold"><i class="ph ph-check-circle align-middle"></i> ${input.files[0].name}</span>`;
    } else {
        display.innerHTML = 'Máximo 5MB';
    }
}

window.submitApplication = async function(e) {
    e.preventDefault();
    
    if(!document.getElementById('terms').checked) {
        alert("Debes aceptar la política de tratamiento de datos.");
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph ph-spinner-gap animate-spin text-xl"></i> Procesando...';

    const nombre = document.getElementById('nombre').value;
    const cedula = document.getElementById('cedula').value;
    const celular = document.getElementById('celular').value;
    const email = document.getElementById('email').value;
    const file = document.getElementById('cv').files[0];

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${cedula}_${nombre.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
        const filePath = `postulaciones/${fileName}`;

        // 1. Subir a Storage
        const { error: uploadError } = await window.supabaseClient.storage
            .from('curriculums')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Obtener Link Público
        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('curriculums')
            .getPublicUrl(filePath);

        // 3. Guardar en la BD
        const nombreCompleto = `${nombre} (CC: ${cedula})`;

        const { error: insertError } = await window.supabaseClient
            .from('postulaciones')
            .insert([{ 
                vacante_id: currentVacanteId, 
                nombre_candidato: nombreCompleto, 
                correo: email, 
                telefono: celular, 
                url_cv: publicUrl 
            }]);

        if (insertError) throw insertError;

        alert('¡Excelente! Hemos recibido tu postulación con éxito.');
        closeModal();

    } catch (err) {
        console.error('Error:', err);
        alert('Hubo un error subiendo tu postulación. Por favor verifica tu conexión e intenta nuevamente.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
    }
}