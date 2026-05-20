import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Privacidad - Leyes Digital",
  description:
    "Politica de privacidad y tratamiento de datos personales de la plataforma Leyes Digital.",
};

const EFFECTIVE_DATE = "11 de mayo de 2026";
const CONTACT_EMAIL = "plataformalegales@gmail.com";

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider">
          Legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2">
          Politica de Privacidad
        </h1>
        <p className="text-slate-400 mt-3 text-sm">
          Ultima actualizacion: {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 leading-relaxed">
        <Section title="1. Quienes somos">
          <p>
            Esta politica describe como Leyes Digital ("la Plataforma",
            "nosotros") trata los datos personales de los usuarios que
            interactuan con nuestro sitio web y servicios. Operamos como
            marketplace que conecta clientes con abogados matriculados en la
            Republica Argentina.
          </p>
          <p>
            Responsable del tratamiento: <strong>Leyes Digital</strong>, con
            domicilio en Mar del Plata, Provincia de Buenos Aires, Argentina.
            Correo de contacto: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="2. Datos que recolectamos">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Datos de cuenta:</strong> nombre, apellido, email,
              telefono, foto de perfil. Para abogados, ademas: matricula
              profesional, especialidades, narrativa profesional, documento
              de matricula, direccion del estudio, CBU/Alias.
            </li>
            <li>
              <strong>Datos de uso:</strong> citas reservadas, pagos
              procesados, mensajes intercambiados con la contraparte,
              calificaciones y reseñas.
            </li>
            <li>
              <strong>Datos tecnicos:</strong> direccion IP, navegador,
              sistema operativo, cookies necesarias para mantener tu sesion.
            </li>
            <li>
              <strong>Datos de pago:</strong> procesamos pagos a traves de
              Mercado Pago. No almacenamos numeros completos de tarjeta,
              CVV ni datos sensibles de tu medio de pago.
            </li>
          </ul>
        </Section>

        <Section title="3. Datos provistos por Google (OAuth)">
          <p>
            Si elegis iniciar sesion con Google, accedemos a la siguiente
            informacion de tu cuenta de Google con tu consentimiento explicito:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Perfil basico</strong> (<code>openid</code>,{" "}
              <code>email</code>, <code>profile</code>): nombre, email y
              foto de perfil para crear tu cuenta y autenticarte.
            </li>
            <li>
              <strong>Google Calendar</strong> (
              <code>https://www.googleapis.com/auth/calendar</code>): solo
              para usuarios registrados como abogados. Lo usamos
              exclusivamente para (a) leer tu disponibilidad (freeBusy) y
              ofrecer horarios libres al cliente; y (b) crear el evento
              de la consulta con link de Google Meet cuando se confirma
              una cita. No leemos el contenido ni los detalles de otros
              eventos de tu calendario.
            </li>
          </ul>
          <p>
            Almacenamos un <em>refresh token</em> de Google de forma cifrada
            para poder crear eventos en tu nombre sin pedirte que vuelvas
            a iniciar sesion en cada cita. Podes revocar este acceso en
            cualquier momento desde{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:underline"
            >
              myaccount.google.com/permissions
            </a>
            .
          </p>
          <p className="text-sm text-slate-400">
            El uso que Leyes Digital hace de la informacion recibida de las
            APIs de Google cumple con la{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , incluyendo los requisitos de Limited Use.
          </p>
        </Section>

        <Section title="4. Como usamos tus datos">
          <ul className="list-disc pl-6 space-y-2">
            <li>Crear y administrar tu cuenta en la Plataforma.</li>
            <li>
              Facilitar el agendamiento de consultas, el procesamiento de
              pagos y la creacion de eventos en Google Calendar.
            </li>
            <li>
              Enviar emails transaccionales (confirmaciones de cita,
              recordatorios 24h antes, cambios de estado del perfil
              profesional, vencimiento de suscripcion, reembolsos).
            </li>
            <li>
              Permitir la comunicacion entre cliente y abogado a traves
              del chat interno.
            </li>
            <li>
              Cumplir obligaciones legales, fiscales y contables.
            </li>
            <li>
              Mejorar la seguridad de la Plataforma y prevenir fraude.
            </li>
          </ul>
          <p>
            No utilizamos tus datos personales para entrenar modelos de
            inteligencia artificial ni los compartimos con terceros con
            fines publicitarios.
          </p>
        </Section>

        <Section title="5. Terceros con los que compartimos datos">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Mercado Pago</strong>: para procesar pagos de consultas
              y suscripciones (datos minimos requeridos por el proveedor).
            </li>
            <li>
              <strong>Google</strong>: para autenticacion OAuth y creacion
              de eventos en Calendar/Meet.
            </li>
            <li>
              <strong>Cloudinary</strong>: para almacenamiento de fotos de
              perfil y documentos de matricula.
            </li>
            <li>
              <strong>Proveedor de email transaccional</strong>: para envio
              de notificaciones por correo.
            </li>
            <li>
              <strong>Neon (PostgreSQL)</strong>: base de datos donde se
              alojan los registros de la Plataforma.
            </li>
            <li>
              <strong>Hosting</strong>: infraestructura cloud para ejecutar
              la Plataforma.
            </li>
          </ul>
          <p>
            Solo compartimos los datos estrictamente necesarios con cada
            proveedor y exigimos a todos un nivel de proteccion al menos
            equivalente al descrito aqui.
          </p>
        </Section>

        <Section title="6. Conservacion">
          <p>
            Conservamos tus datos mientras tengas una cuenta activa y por
            el plazo adicional que exija la normativa argentina
            (especialmente la Ley 25.326 de Proteccion de Datos
            Personales y normativa fiscal). Pasado ese tiempo, los datos
            se anonimizan o eliminan.
          </p>
        </Section>

        <Section title="7. Tus derechos">
          <p>
            Como titular de los datos tenes derecho de acceso, rectificacion,
            actualizacion y supresion. Para ejercerlos escribinos a{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. La
            Agencia de Acceso a la Informacion Publica (AAIP) es el
            organismo de control en Argentina y podes presentar denuncias
            o reclamos ante ella.
          </p>
        </Section>

        <Section title="8. Seguridad">
          <p>
            Implementamos medidas tecnicas y organizativas razonables para
            proteger tus datos: cifrado en transito (HTTPS), almacenamiento
            de contraseñas con bcrypt, control de acceso por roles,
            verificacion HMAC de webhooks de pago y aislamiento de
            credenciales en variables de entorno.
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            Usamos cookies tecnicas para mantener tu sesion iniciada. No
            usamos cookies de marketing ni de seguimiento publicitario.
          </p>
        </Section>

        <Section title="10. Cambios a esta politica">
          <p>
            Podemos actualizar esta politica cuando cambien nuestras
            practicas o el marco legal aplicable. Te notificaremos por
            email o en la Plataforma cuando los cambios sean significativos.
            La version vigente sera siempre la publicada en esta pagina.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p>
            Para consultas sobre privacidad o ejercicio de derechos:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>
      </div>

      <footer className="mt-14 pt-8 border-t border-white/5 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/terminos" className="text-brand-400 hover:underline">
          Terminos y Condiciones
        </Link>
        <span className="text-slate-600">·</span>
        <Link href="/contacto" className="text-brand-400 hover:underline">
          Contacto
        </Link>
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
