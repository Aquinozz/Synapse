import React from 'react';

/**
 * Version of the terms. Keep equal to TERMS_VERSION in server/src/config.js: changing the
 * text means changing both, and everyone is then asked to accept again.
 */
export const TERMS_VERSION = '2026-10-01';

/**
 * Who answers for the data. Fill these in before going live: the terms cannot name a
 * controller or a contact that does not exist. Empty fields are left out of the text.
 */
export const CONTROLLER = {
  name: 'Synapse',
  legalName: '',
  cnpj: '',
  /** E-mail of the data protection officer (encarregado, LGPD art. 41) */
  privacyEmail: '',
};

interface Section {
  title: string;
  body: React.ReactNode;
}

const contact = CONTROLLER.privacyEmail ? (
  <>
    pelo e-mail <strong>{CONTROLLER.privacyEmail}</strong>
  </>
) : (
  <>pelo canal de atendimento do Synapse</>
);

// The text describes what the system actually does today. When a feature changes what is
// collected, stored or shared, this text and TERMS_VERSION must change with it.
export const TERMS_SECTIONS: Section[] = [
  {
    title: '1. Quem trata os seus dados',
    body: (
      <p>
        O {CONTROLLER.name}
        {CONTROLLER.legalName && ` (${CONTROLLER.legalName}${CONTROLLER.cnpj ? `, CNPJ ${CONTROLLER.cnpj}` : ''})`} é o
        controlador dos dados pessoais tratados nesta plataforma, nos termos da Lei Geral de Proteção de Dados
        (Lei nº 13.709/2018, a LGPD).
      </p>
    ),
  },
  {
    title: '2. Quais dados tratamos',
    body: (
      <ul>
        <li>
          <strong>Cadastro:</strong> nome, e-mail, senha e, se você quiser, uma foto de perfil. A senha é guardada de
          forma irreversível; ninguém do Synapse consegue lê-la. A foto pode ser trocada ou removida a qualquer momento.
        </li>
        <li>
          <strong>Vínculo com a empresa:</strong> se você é funcionário, a empresa que paga o seu plano.
        </li>
        <li>
          <strong>Dados profissionais:</strong> se você é psicólogo, registro profissional, especialidade, apresentação,
          foto de perfil e horários de atendimento. Esses dados formam o seu perfil, visível aos funcionários das
          empresas atendidas.
        </li>
        <li>
          <strong>Sessões:</strong> o psicólogo escolhido, o dia, o horário e o formato da sessão semanal, além das
          remarcações.
        </li>
        <li>
          <strong>Avaliações de psicólogos:</strong> a nota e o comentário que o funcionário decide publicar sobre o
          seu psicólogo. Aparecem sem o nome de quem escreveu para os funcionários das empresas atendidas e para o
          próprio psicólogo, e podem ser alteradas ou excluídas pelo autor a qualquer momento.
        </li>
        <li>
          <strong>Avaliação das sessões:</strong> a nota e o comentário que o psicólogo registra a cada sessão, para
          acompanhar a evolução do paciente. Só o próprio psicólogo tem acesso; nem a empresa nem outros profissionais
          veem essas avaliações.
        </li>
        <li>
          <strong>Segurança:</strong> registro das tentativas de acesso, com o endereço IP, para impedir tentativas de
          adivinhar senhas.
        </li>
        <li>
          <strong>Check-in diário:</strong> o índice de bem-estar do dia, calculado pelas suas respostas. As respostas em
          si não são guardadas. Se o índice ficar muito baixo, o psicólogo que atende você é avisado para poder ajudar.
          A empresa nunca vê o resultado individual.
        </li>
        <li>
          <strong>No seu aparelho:</strong> as respostas do check-in, as anotações do psicólogo e as preferências de
          acessibilidade ficam, nesta versão, guardadas apenas no navegador que você usa. Elas não são enviadas aos
          nossos servidores.
        </li>
      </ul>
    ),
  },
  {
    title: '3. Dados de saúde',
    body: (
      <p>
        Saber que uma pessoa faz acompanhamento psicológico, com quem e quando é um dado pessoal sensível (LGPD, art. 5º,
        II), assim como a avaliação que o psicólogo registra de cada sessão. Tratamos esses dados apenas com o seu
        consentimento específico e destacado (art. 11, I), dado em separado deste termo, e somente para agendar,
        realizar e acompanhar as suas sessões.
      </p>
    ),
  },
  {
    title: '4. Para que usamos e com que base legal',
    body: (
      <ul>
        <li>
          <strong>Criar a conta e prestar o serviço</strong> (agendar, remarcar e realizar sessões): execução do contrato
          (art. 7º, V).
        </li>
        <li>
          <strong>Tratar dados de saúde:</strong> seu consentimento (art. 11, I).
        </li>
        <li>
          <strong>Proteger as contas contra acesso indevido:</strong> legítimo interesse e prevenção à fraude (art. 7º, IX,
          e art. 11, II, g).
        </li>
        <li>
          <strong>Cumprir obrigações legais ou regulatórias</strong> (art. 7º, II).
        </li>
      </ul>
    ),
  },
  {
    title: '5. O que a sua empresa vê',
    body: (
      <p>
        A empresa paga o plano e sabe quais funcionários têm direito a ele. Ela <strong>não</strong> recebe a informação de
        quem agendou, com qual psicólogo, em que dia ou horário, nem qualquer conteúdo das sessões. Indicadores de
        bem-estar, quando oferecidos à empresa, são sempre agregados e anônimos, com no mínimo 5 respostas por grupo.
      </p>
    ),
  },
  {
    title: '6. Com quem compartilhamos',
    body: (
      <ul>
        <li>
          <strong>O psicólogo que você escolher</strong> vê o seu nome, a sua foto de perfil (se houver) e o horário
          das suas sessões.
        </li>
        <li>
          <strong>Prestadores de hospedagem e banco de dados</strong>, que operam os dados em nosso nome e podem
          armazená-los fora do Brasil.
        </li>
        <li>
          <strong>Autoridades</strong>, quando houver obrigação legal ou ordem judicial.
        </li>
      </ul>
    ),
  },
  {
    title: '7. Sigilo profissional',
    body: (
      <p>
        Os psicólogos estão sujeitos ao sigilo previsto no Código de Ética Profissional do Psicólogo. Os registros
        clínicos das sessões são de responsabilidade do profissional, conforme as normas do Conselho Federal de Psicologia.
      </p>
    ),
  },
  {
    title: '8. Por quanto tempo guardamos',
    body: (
      <p>
        Mantemos os seus dados enquanto a sua conta existir. Encerrada a conta, eliminamos os dados, salvo os que
        precisarem ser guardados por obrigação legal ou regulatória, pelo prazo que a norma exigir.
      </p>
    ),
  },
  {
    title: '9. Seus direitos',
    body: (
      <>
        <p>A LGPD (art. 18) garante a você, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos os seus dados e acessá-los;</li>
          <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários ou excessivos;</li>
          <li>pedir a portabilidade dos dados;</li>
          <li>saber com quem os dados foram compartilhados;</li>
          <li>revogar o consentimento e pedir a eliminação dos dados tratados com base nele.</li>
        </ul>
        <p>
          Para exercer qualquer direito, fale com o encarregado pelo tratamento de dados {contact}. Você também pode
          apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </>
    ),
  },
  {
    title: '10. Segurança',
    body: (
      <p>
        O acesso é feito por conexão criptografada. Senhas e credenciais de sessão são guardadas de forma irreversível, e
        cada perfil só enxerga o que lhe cabe: funcionários não veem dados de outros funcionários, e psicólogos veem apenas
        os próprios pacientes. Nenhum sistema é imune a falhas; se houver incidente que possa causar risco ou dano
        relevante, comunicaremos você e a ANPD, como determina o art. 48 da LGPD.
      </p>
    ),
  },
  {
    title: '11. O Synapse não é serviço de emergência',
    body: (
      <p>
        Em situação de crise ou risco, ligue <strong>188</strong> (CVV, 24 horas, gratuito) ou <strong>192</strong> (SAMU).
      </p>
    ),
  },
  {
    title: '12. Mudanças neste termo',
    body: (
      <p>
        Se o termo mudar, você será avisado e precisará aceitar a nova versão para continuar usando a plataforma. A versão
        em vigor fica sempre disponível no site.
      </p>
    ),
  },
];

const formatVersion = (version: string) => version.split('-').reverse().join('/');

/** The full text of the terms, for the modal and for the acceptance screen */
export const TermsContent: React.FC = () => (
  <div className="flex flex-col gap-4 font-outfit text-sm text-[#494454] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_strong]:text-[#0b1c30] [&_strong]:font-semibold [&_p+ul]:mt-1.5 [&_ul+p]:mt-2">
    <p>
      Este termo explica, de forma direta, quais dados pessoais o {CONTROLLER.name} trata, para quê e quais são os seus
      direitos. Versão de {formatVersion(TERMS_VERSION)}.
    </p>
    {TERMS_SECTIONS.map((section) => (
      <section key={section.title} className="flex flex-col gap-1.5">
        <h3 className="font-sora text-sm font-bold text-[#0b1c30]">{section.title}</h3>
        {section.body}
      </section>
    ))}
  </div>
);
