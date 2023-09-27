import { AuthGuard } from 'src/guards/auth-guard';

export const withAuthGuard = <TProps extends object>(protect: boolean, Component: React.FC<TProps>) => (props: TProps) => (
  <AuthGuard protect={protect}>
    <Component {...props} />
  </AuthGuard>
);
