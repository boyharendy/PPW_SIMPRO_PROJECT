'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function useLecturers() {
  const [rows,setRows]=useState<{id:string;nama:string;nama_lengkap:string}[]>([]);
  useEffect(()=>{
    let active=true;
    apiClient.get<{id:string;nama_lengkap:string}[]>('/ref/lecturers')
      .then(res=>{if(active)setRows((res.data || []).map(d=>({...d,nama:d.nama_lengkap})));})
      .catch(()=>{if(active)setRows([]);});
    return ()=>{active=false;};
  },[]);
  return rows;
}
