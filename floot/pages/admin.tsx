"use client";
import {Helmet} from 'react-helmet';
import {AdminDashboard} from '../components/AdminDashboard';
export default function AdminPage(){return <><Helmet><title>CET-4 Copilot · 管理后台</title><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/></Helmet><AdminDashboard/></>;}
