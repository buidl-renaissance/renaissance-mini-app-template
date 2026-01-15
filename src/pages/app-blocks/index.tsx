import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loading } from '@/components/Loading';

/**
 * App Blocks index page - redirects to dashboard
 * The dashboard now serves as the single place to view and manage all blocks
 */
const AppBlocksPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return <Loading text="Loading..." />;
};

export default AppBlocksPage;
