// Puente mínimo al modelo del sistema de macOS (FoundationModels), para el ejecutor scripts/investigar/sistema.mjs.
// decisions/investigator-system-model.md. Se compila al correr (swiftc de las Command Line Tools) en una carpeta temporal;
// nada se instala ni se descarga. No abre la red: recibe por stdin el texto que ya bajó el script y devuelve JSON por
// stdout. Sin macros (@Generable pide el plugin de Xcode): el esquema de la salida se arma en tiempo de ejecución.
//
// Entrada (una línea JSON):
//   {"modo":"disponible"}
//   {"modo":"generar","instrucciones":"…","prompt":"…","componentes":["id-a","id-b"],"maximo":4}
// Salida: {"disponible":true,"idiomas":["en","es",…]} · {"disponible":false,"razon":"…"} · {"hallazgos":[…]} · {"error":"…"}
import Foundation
import FoundationModels

struct Pedido: Decodable {
  let modo: String
  let instrucciones: String?
  let prompt: String?
  let componentes: [String]?
  let maximo: Int?
}

func escribir(_ objeto: [String: Any]) {
  let datos = try! JSONSerialization.data(withJSONObject: objeto, options: [.sortedKeys])
  FileHandle.standardOutput.write(datos)
  FileHandle.standardOutput.write("\n".data(using: .utf8)!)
}

func razon(_ r: SystemLanguageModel.Availability.UnavailableReason) -> String {
  switch r {
  case .deviceNotEligible: return "este equipo no es elegible para Apple Intelligence"
  case .appleIntelligenceNotEnabled: return "Apple Intelligence está apagado en Configuración del Sistema"
  case .modelNotReady: return "el modelo del sistema todavía no está listo (se está descargando o preparando)"
  @unknown default: return "el sistema dice que el modelo no está disponible (\(r))"
  }
}

let linea = FileHandle.standardInput.readDataToEndOfFile()
guard let pedido = try? JSONDecoder().decode(Pedido.self, from: linea) else {
  escribir(["error": "la entrada no es un pedido JSON"])
  exit(2)
}

let modelo = SystemLanguageModel.default
switch modelo.availability {
case .unavailable(let r):
  escribir(["disponible": false, "razon": razon(r)])
  exit(0)
case .available:
  break
}

if pedido.modo == "disponible" {
  let idiomas = Set(modelo.supportedLanguages.compactMap { $0.languageCode?.identifier })
  escribir(["disponible": true, "idiomas": idiomas.sorted(), "contexto": modelo.contextSize])
  exit(0)
}

guard pedido.modo == "generar", let instrucciones = pedido.instrucciones, let prompt = pedido.prompt,
  let componentes = pedido.componentes, !componentes.isEmpty
else {
  escribir(["error": "pedido incompleto"])
  exit(2)
}

// El componente se elige de la lista (anyOf): el modelo no inventa ids.
let hallazgo = DynamicGenerationSchema(
  name: "Hallazgo",
  properties: [
    .init(name: "componente", description: "El id del componente del que habla el texto", schema: .init(name: "Componente", anyOf: componentes)),
    .init(name: "enunciado_es", description: "Lo que el texto afirma de ese componente, en una frase en español", schema: .init(type: String.self)),
    .init(name: "enunciado_en", description: "The same statement, written in English", schema: .init(type: String.self)),
    .init(name: "cita", description: "Una frase COPIADA LETRA POR LETRA del texto, en su idioma, que respalda el enunciado", schema: .init(type: String.self)),
  ])
let raiz = DynamicGenerationSchema(
  name: "Borrador",
  properties: [
    .init(name: "hallazgos", schema: .init(arrayOf: .init(referenceTo: "Hallazgo"), minimumElements: 0, maximumElements: pedido.maximo ?? 4))
  ])

let semaforo = DispatchSemaphore(value: 0)
Task {
  do {
    let esquema = try GenerationSchema(root: raiz, dependencies: [hallazgo])
    let sesion = LanguageModelSession(instructions: instrucciones)
    // Temperatura 0: la misma entrada, la misma salida, en lo que el sistema lo permita.
    let r = try await sesion.respond(to: prompt, schema: esquema, options: GenerationOptions(sampling: .greedy))
    let datos = r.content.jsonString.data(using: .utf8)!
    let objeto = (try? JSONSerialization.jsonObject(with: datos)) as? [String: Any] ?? [:]
    escribir(["hallazgos": objeto["hallazgos"] ?? []])
  } catch {
    escribir(["error": "\(error)"])
  }
  semaforo.signal()
}
semaforo.wait()
