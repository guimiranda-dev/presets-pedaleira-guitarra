import { useState, type FormEvent } from "react";
import { useEmailAuth } from "@/hooks/use-email-auth";
import styles from "./repertoire.module.css";

type Auth = ReturnType<typeof useEmailAuth>;

export function EmailLogin({ auth }: { auth: Auth }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sentTo) { await auth.verifyCode(sentTo, code); return; }
    const normalized = email.trim().toLowerCase();
    if (await auth.requestCode(normalized)) setSentTo(normalized);
  }

  return (
    <div className={styles["login-panel"]}>
      <span className={styles.eyebrow}>MEU REPERTÓRIO</span>
      <h4>{sentTo ? "Confira seu e-mail." : "Seu repertório, sem senha."}</h4>
      <p>{sentTo ? `Se ${sentTo} estiver autorizado, você receberá um código válido por 10 minutos.` : "Entre com seu e-mail autorizado. Enviaremos um código de acesso para você."}</p>
      <form className={styles["login-form"]} onSubmit={submit}>
        {sentTo ? <label>Código de acesso
          <input key="code" autoFocus required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" className={styles["otp-input"]} disabled={auth.busy} />
        </label> : <label>Seu e-mail
          <input key="email" required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" disabled={auth.loading || auth.busy} />
        </label>}
        <button type="submit" className={styles.primary} disabled={auth.loading || auth.busy || (!sentTo && auth.cooldown > 0)}>
          {auth.loading ? "Verificando sessão…" : auth.busy ? "Aguarde…" : sentTo ? "Verificar código e entrar" : auth.cooldown > 0 ? `Aguarde ${auth.cooldown}s` : "Enviar código por e-mail"}
        </button>
      </form>
      {sentTo && <div className={styles["login-actions"]}>
        <button type="button" className={styles.secondary} disabled={auth.busy || auth.cooldown > 0} onClick={async () => { if (await auth.requestCode(sentTo)) setCode(""); }}>{auth.cooldown > 0 ? `Reenviar em ${auth.cooldown}s` : "Reenviar código"}</button>
        <button type="button" className={styles.secondary} disabled={auth.busy} onClick={() => { setSentTo(""); setCode(""); }}>Trocar e-mail</button>
      </div>}
      {auth.error && <p role="alert" className={styles.warning}>{auth.error}</p>}
    </div>
  );
}
