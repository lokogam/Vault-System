import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="min-h-screen bg-gray-100 py-12">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-4xl font-bold text-blue-600 text-center mb-8">
        ¡Tailwind CSS con Vite!
      </h1>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">
          Características
        </h2>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li>Configuración rápida con Vite</li>
          <li>Tailwind CSS para estilos utilitarios</li>
          <li>Hot reload durante el desarrollo</li>
        </ul>
      </div>

      <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Botón de ejemplo
      </button>
    </div>
  </div>
`