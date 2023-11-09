import { AuthGuard } from 'src/guards/auth-guard';

/**
 * An HOC which guards access to the underlying {@link Component}
 * @param protect If true, unauthorized access will be redirected to login. If
 *  false, authorized access will be redirected to dashboard (home screen).
 * @param Component A component which is protected. 
 * @returns A new component which guards access.
 */
export const withAuthGuard = <TProps extends object>(protect: boolean, Component: React.FC<TProps>) => (props: TProps) => (
  <AuthGuard protect={protect}>
    <Component {...props} />
  </AuthGuard>
);
