import {useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Helmet} from 'react-helmet';
import {Button} from '../components/Button';import {Input} from '../components/Input';
import {postPasswordRecovery} from '../endpoints/auth/password_recovery_POST.schema';
import {postPasswordReset} from '../endpoints/auth/password_reset_POST.schema';
import styles from './login.module.css';
export default function ForgotPassword(){
 const location=useLocation();const token=new URLSearchParams(location.hash.slice(1)).get('token');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmPassword,setConfirm]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[done,setDone]=useState(false);
 return <main className={styles.page}><Helmet><title>找回密码 · CET-4 Copilot</title><meta name="referrer" content="no-referrer"/><meta name="robots" content="noindex"/></Helmet><section className={styles.formSide}><div className={styles.formCard}><h1>{token?'设置新密码':'找回密码'}</h1><p className={styles.formIntro}>{token?'链接只能使用一次，有效期30分钟。重设后请重新登录。':'当前使用人工核验找回。提交后请通过你与管理员已有的联系方式完成账号核验，管理员会提供一次性恢复链接。'}</p>
 {!done&&<form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{if(token){await postPasswordReset({token,password,confirmPassword});setMessage('密码已更新，原登录已退出，学习记录保留。');}else{const result=await postPasswordRecovery({email});setMessage(result.message);}setDone(true);}catch(e){setError(e instanceof Error?e.message:'提交失败，请重试。');}finally{setBusy(false);}}}>
 {token?<><label htmlFor="new-password">新密码（至少10个字符）</label><Input id="new-password" type="password" autoComplete="new-password" minLength={10} required value={password} onChange={e=>setPassword(e.target.value)}/><label htmlFor="confirm-password">再次输入新密码</label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={e=>setConfirm(e.target.value)}/></>:<><label htmlFor="recovery-email">注册邮箱</label><Input id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></>}
 <Button type="submit" disabled={busy} style={{marginTop:20}}>{busy?'正在提交…':token?'确认更新密码':'提交找回申请'}</Button></form>}
 {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}<p><Link to="/login">返回登录</Link>{token&&<> · <a href="/forgot-password">重新申请</a></>}</p></div></section></main>;
}
