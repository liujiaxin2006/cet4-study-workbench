import React from 'react';
import {Navigate,Link,useLocation} from 'react-router-dom';
import {useAuth} from '../helpers/useAuth';
import type {User} from '../helpers/User';
import {Button} from './Button';
import styles from './ProtectedRoute.module.css';
const MakeProtectedRoute=(roles:User['role'][]):React.FC<{children:React.ReactNode}>=>({children})=>{
 const {authState,logout}=useAuth();const location=useLocation();
 if(authState.type==='loading')return <main className={styles.gate} role="status"><h1>正在确认登录状态…</h1></main>;
 if(authState.type==='unauthenticated'){
  if(authState.sessionUnavailable)return <main className={styles.gate}><h1>暂时无法确认登录状态</h1><p>请检查网络后重新读取，你的账号权限没有因此改变。</p><Button onClick={()=>window.location.reload()}>重新读取</Button></main>;
  return <Navigate to={'/login?next='+encodeURIComponent(location.pathname+location.search)} replace/>;
 }
 if(!roles.includes(authState.user.role))return <main className={styles.gate}><h1>请使用管理员账号</h1><p>当前登录：{authState.user.email}</p><p>这个账号可以使用学习功能，但没有查看运营数据和题库管理的权限。</p><Button onClick={()=>void logout()}>退出并切换账号</Button><Link to="/">返回学习工作台</Link></main>;
 return <>{children}</>;
};
export const AdminRoute=MakeProtectedRoute(['admin']);
export const UserRoute=MakeProtectedRoute(['user','admin']);
