// component
import SvgColor from '../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'budgets',
    path: '/dashboard/budgets',
    icon: icon('ic_blog'),
  },
  {
    title: 'transactions',
    path: '/dashboard/transactions',
    icon: icon('ic_cart'),
  },
  {
    title: 'statistics',
    path: '/dashboard/statistics',
    icon: icon('ic_analytics'),
  },
  {
    title: 'profile',
    path: '/dashboard/profile',
    icon: icon('ic_user'),
  }
];

export default navConfig;
