import { useSearchParams } from 'react-router-dom';
export function useUrlMssv() {
  const [params, setParams] = useSearchParams();
  const mssv = params.get('mssv') || '';
  const setMssv = (val) => {
    if (val) setParams({ mssv: val });
    else setParams({});
  };
  return [mssv, setMssv];
}
