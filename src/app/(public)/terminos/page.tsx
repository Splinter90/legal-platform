import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terminos y Condiciones - Leges Digital",
  description:
    "Terminos y condiciones de uso del marketplace legal Leges Digital.",
};

const EFFECTIVE_DATE = "11 de mayo de 2026";
const CONTACT_EMAIL = "contacto@legesdigital.com";

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider">
          Legal
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2">
          Terminos y Condiciones
        </h1>
        <p className="text-slate-400 mt-3 text-sm">
          Ultima actualizacion: {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="space-y-8 text-slate-300 leading-relaxed">
        <Section title="1. Aceptacion">
          <p>
            Estos Terminos regulan el uso de la plataforma Leges Digital
            ("la Plataforma"). Al registrarte, acceder o utilizar la
            Plataforma aceptas estos Terminos. Si no estas de acuerdo, no
            la utilices.
          </p>
        </Section>

        <Section title="2. Que es Leges Digital">
          <p>
            La Plataforma es un marketplace que conecta clientes con
            abogados matriculados en la Republica Argentina. No prestamos
            servicios legales: solo facilitamos el contacto, la agenda
            de consultas y el cobro a traves de Mercado Pago.
          </p>
          <p>
            La relacion profesional se establece directamente entre el
            cliente y el abogado. Leges Digital no es parte de esa
            relacion ni asume responsabilidad por el contenido del
            asesoramiento brindado.
          </p>
        </Section>

        <Section title="3. Cuentas">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Para usar la Plataforma debes crear una cuenta con datos
              verdaderos, completos y actualizados.
            </li>
            <li>
              Sos responsable de mantener la confidencialidad de tus
              credenciales y de toda actividad realizada desde tu cuenta.
            </li>
            <li>
              Podemos suspender o eliminar cuentas que incumplan estos
              Terminos, las leyes aplicables o que sean utilizadas con
              fines fraudulentos.
            </li>
          </ul>
        </Section>

        <Section title="4. Requisitos para abogados">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Para registrarte como abogado debes acreditar matricula
              vigente en un colegio profesional de la Republica
              Argentina y cargar la documentacion respaldatoria.
            </li>
            <li>
              Tu perfil queda en estado <em>pendiente</em> hasta ser
              revisado y aprobado por el equipo administrador. Podemos
              rechazarlo o suspenderlo si la informacion es insuficiente,
              falsa o si se reciben reclamos fundados.
            </li>
            <li>
              Para aparecer en busquedas y en el mapa necesitas tener una
              suscripcion mensual activa. El vencimiento se calcula a
              partir del ultimo pago aprobado.
            </li>
            <li>
              Sos responsable de cumplir con tus obligaciones fiscales,
              previsionales, deontologicas y de confidencialidad respecto
              de los clientes que te contacten por la Plataforma.
            </li>
          </ul>
        </Section>

        <Section title="5. Reservas y consultas">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              El cliente reserva un horario disponible publicado por el
              abogado y abona la consulta mediante Mercado Pago.
            </li>
            <li>
              Una vez acreditado el pago, la cita queda confirmada y se
              crea automaticamente un evento en Google Calendar con link
              de Google Meet.
            </li>
            <li>
              Cliente y abogado deben asistir a la consulta en el horario
              pactado. La duracion por defecto es la configurada por el
              abogado.
            </li>
          </ul>
        </Section>

        <Section title="6. Pagos, comisiones y suscripcion">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              El precio de la consulta es definido por el administrador
              de la Plataforma y publicado en cada momento. Leges Digital
              retiene una comision sobre cada consulta cobrada.
            </li>
            <li>
              La suscripcion mensual del abogado se renueva manualmente
              cada 30 dias. Si no se renueva, el perfil deja de aparecer
              en busquedas hasta que se regularice.
            </li>
            <li>
              Todos los pagos se procesan a traves de Mercado Pago. Leges
              Digital no almacena datos sensibles de tarjetas ni medios
              de pago.
            </li>
          </ul>
        </Section>

        <Section title="7. Cancelaciones y reembolsos">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              El cliente puede cancelar una cita confirmada desde su
              panel <strong>hasta 24 horas antes</strong> del horario
              pactado. La devolucion del pago se procesa automaticamente
              al medio de pago original a traves de Mercado Pago.
            </li>
            <li>
              Dentro de las 24 horas previas a la consulta, la cita no
              se puede cancelar para respetar el tiempo reservado por el
              abogado. La consulta debe realizarse en el horario
              acordado.
            </li>
            <li>
              El abogado puede cancelar una cita confirmada en cualquier
              momento si surge una imposibilidad. En ese caso la
              devolucion completa al cliente se procesa automaticamente.
            </li>
            <li>
              Los reembolsos en Mercado Pago pueden tardar entre 1 y 10
              dias habiles en verse acreditados, segun el banco o tarjeta
              emisora.
            </li>
          </ul>
        </Section>

        <Section title="8. Conducta esperada">
          <p>El usuario se compromete a:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>No publicar contenido falso, injurioso o ilegal.</li>
            <li>No usar la Plataforma para hostigar a otros usuarios.</li>
            <li>No intentar vulnerar la seguridad ni acceder a datos de terceros.</li>
            <li>No automatizar el uso de la Plataforma sin autorizacion previa.</li>
          </ul>
        </Section>

        <Section title="9. Reseñas">
          <p>
            Los clientes que hayan tenido una consulta pueden dejar una
            calificacion y un comentario sobre el abogado. Las reseñas
            deben ser veraces, basadas en la experiencia personal y no
            contener insultos, datos personales sensibles ni informacion
            confidencial. Podemos eliminar reseñas que incumplan estas
            pautas.
          </p>
        </Section>

        <Section title="10. Propiedad intelectual">
          <p>
            La marca, el logo, los textos, el codigo y los demas elementos
            de la Plataforma pertenecen a Leges Digital o a sus
            licenciantes y estan protegidos por la legislacion de
            propiedad intelectual. Esta prohibido reproducirlos sin
            autorizacion escrita.
          </p>
          <p>
            El contenido que cada usuario carga (foto de perfil,
            narrativa, mensajes) sigue siendo de su propiedad, pero
            otorga a la Plataforma una licencia no exclusiva para
            mostrarlo dentro del servicio.
          </p>
        </Section>

        <Section title="11. Limitacion de responsabilidad">
          <p>
            La Plataforma se ofrece "tal cual" y "segun disponibilidad".
            En la maxima medida permitida por la ley, Leges Digital no
            sera responsable por daños indirectos, lucro cesante,
            perdida de oportunidad ni daño moral derivado del uso o
            imposibilidad de uso de la Plataforma, ni por la calidad o
            resultado del asesoramiento profesional brindado por los
            abogados.
          </p>
        </Section>

        <Section title="12. Modificaciones">
          <p>
            Podemos modificar estos Terminos cuando sea necesario. Los
            cambios se publicaran en esta pagina con su fecha de vigencia.
            Si seguis usando la Plataforma despues de la actualizacion,
            se considerara que los aceptas.
          </p>
        </Section>

        <Section title="13. Ley aplicable y jurisdiccion">
          <p>
            Estos Terminos se rigen por las leyes de la Republica
            Argentina. Cualquier controversia se resolvera ante los
            tribunales ordinarios con asiento en la ciudad de Mar del
            Plata, Provincia de Buenos Aires, salvo norma de orden
            publico en contrario.
          </p>
        </Section>

        <Section title="14. Contacto">
          <p>
            Para reclamos, consultas o notificaciones formales:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>
      </div>

      <footer className="mt-14 pt-8 border-t border-white/5 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/privacidad" className="text-brand-400 hover:underline">
          Politica de Privacidad
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
