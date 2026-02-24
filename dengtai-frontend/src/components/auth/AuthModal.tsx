import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { authService } from "@/services/authService";
import DevToast from "@/components/common/DevToast";
import type { LoginRequest, RegisterRequest } from "@/types/auth";
import styles from "./AuthModal.module.css";

// ─── LoginForm ───
type LoginFormProps = {
  phone: string;
  onPhoneChange: (v: string) => void;
  login: (p: LoginRequest) => Promise<void>;
  onSuccess: () => void;
};

const LoginForm = ({ phone, onPhoneChange, login, onSuccess }: LoginFormProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const handleDismissToast = useCallback(() => setToastVisible(false), []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = window.setTimeout(() => setCountdown(p => p - 1), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone) { setError("请先填写手机号"); return; }
    setError(null);
    setSendingCode(true);
    try {
      const res = await authService.sendCode({ scene: "LOGIN", identifierType: "PHONE", identifier: phone });
      setCountdown(Math.max(1, res.expireSeconds ?? 300));
      if (res.devCode) { setCode(res.devCode); setToastVisible(true); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally { setSendingCode(false); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ identifierType: "PHONE", identifier: phone, code });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="modal-login-phone">手机号</label>
          <input id="modal-login-phone" className={styles.input} value={phone}
            onChange={e => onPhoneChange(e.target.value)} placeholder="请输入手机号" type="tel" autoComplete="tel" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="modal-login-code">验证码</label>
          <div className={styles.codeRow}>
            <input id="modal-login-code" className={styles.input} value={code}
              onChange={e => setCode(e.target.value)} placeholder="请输入验证码" autoComplete="one-time-code" />
            <button type="button" className={styles.codeButton}
              disabled={sendingCode || countdown > 0} onClick={handleSendCode}>
              {countdown > 0 ? `${countdown}s` : "获取验证码"}
            </button>
          </div>
          <span className={styles.tips}>验证码用于校验登录，不需要输入密码。</span>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" className={styles.submitButton} disabled={submitting || !phone || !code}>
          {submitting ? "登录中..." : "登录"}
        </button>
      </form>
      <DevToast message="开发模式：验证码已自动填入哦~" visible={toastVisible} onDismiss={handleDismissToast} />
    </>
  );
};

// ─── RegisterForm ───
type RegisterFormProps = {
  phone: string;
  onPhoneChange: (v: string) => void;
  register: (p: RegisterRequest) => Promise<unknown>;
  onSuccess: () => void;
};

const RegisterForm = ({ phone, onPhoneChange, register, onSuccess }: RegisterFormProps) => {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const handleDismissToast = useCallback(() => setToastVisible(false), []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = window.setTimeout(() => setCountdown(p => p - 1), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!phone) { setError("请先填写手机号"); return; }
    setError(null);
    setMessage(null);
    setSendingCode(true);
    try {
      const res = await authService.sendCode({ scene: "REGISTER", identifierType: "PHONE", identifier: phone });
      setCountdown(60);
      if (res.devCode) { setCode(res.devCode); setToastVisible(true); }
      else { setMessage("验证码已发送，请注意查收"); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally { setSendingCode(false); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await register({ identifierType: "PHONE", identifier: phone, code, password, agreeTerms });
      setMessage("注册成功，已自动登录");
      setTimeout(onSuccess, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally { setSubmitting(false); }
  };

  const isDisabled = submitting || !phone || !code || !password || !agreeTerms;

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="modal-reg-phone">手机号</label>
          <input id="modal-reg-phone" className={styles.input} value={phone}
            onChange={e => onPhoneChange(e.target.value)} placeholder="请输入手机号" type="tel" autoComplete="tel" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="modal-reg-code">验证码</label>
          <div className={styles.codeRow}>
            <input id="modal-reg-code" className={styles.input} value={code}
              onChange={e => setCode(e.target.value)} placeholder="请输入验证码" autoComplete="one-time-code" />
            <button type="button" className={styles.codeButton}
              disabled={sendingCode || countdown > 0} onClick={handleSendCode}>
              {countdown > 0 ? `${countdown}s` : "获取验证码"}
            </button>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="modal-reg-pwd">登录密码</label>
          <input id="modal-reg-pwd" className={styles.input} type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="请设置不少于 8 位的密码" autoComplete="new-password" />
        </div>
        <div className={styles.checkboxRow}>
          <input id="modal-reg-agree" type="checkbox" checked={agreeTerms}
            onChange={e => setAgreeTerms(e.target.checked)} />
          <label htmlFor="modal-reg-agree">
            我已阅读并同意
            <a href="#" onClick={ev => ev.preventDefault()}>《用户协议》</a>和
            <a href="#" onClick={ev => ev.preventDefault()}>《隐私政策》</a>
          </label>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}
        <button type="submit" className={styles.submitButton} disabled={isDisabled}>
          {submitting ? "注册中..." : "立即注册"}
        </button>
      </form>
      <DevToast message="开发模式：验证码已自动填入哦~" visible={toastVisible} onDismiss={handleDismissToast} />
    </>
  );
};

// ─── AuthModal ───
const AuthModal = () => {
  const { isOpen, tab, sharedPhone, closeAuthModal, switchTab, setSharedPhone } = useAuthModal();
  const { login, register } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) { requestAnimationFrame(() => setVisible(true)); }
    else { setVisible(false); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeAuthModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeAuthModal]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeAuthModal();
  }, [closeAuthModal]);

  if (!isOpen) return null;

  const overlayClass = `${styles.overlay} ${visible ? styles.overlayVisible : ""}`;
  const modalClass = `${styles.modal} ${visible ? styles.modalVisible : ""}`;

  return (
    <div ref={overlayRef} className={overlayClass} onClick={handleOverlayClick}>
      <div className={modalClass} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="关闭">×</button>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => switchTab("login")}>登录</button>
          <button className={`${styles.tab} ${tab === "register" ? styles.tabActive : ""}`}
            onClick={() => switchTab("register")}>注册</button>
        </div>
        {tab === "login" ? (
          <LoginForm phone={sharedPhone} onPhoneChange={setSharedPhone} login={login} onSuccess={closeAuthModal} />
        ) : (
          <RegisterForm phone={sharedPhone} onPhoneChange={setSharedPhone} register={register} onSuccess={closeAuthModal} />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
