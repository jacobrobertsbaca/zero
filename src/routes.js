import { Navigate, useRoutes } from 'react-router-dom';
// layouts
import DashboardLayout from './layouts/dashboard';
import SimpleLayout from './layouts/simple';
//
import BudgetPage from './pages/BudgetPage';
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import Page404 from './pages/Page404';
import ProductsPage from './pages/ProductsPage';
import DashboardAppPage from './pages/DashboardAppPage';

// ----------------------------------------------------------------------

export default function Router() {
  const routes = useRoutes([
    {
      path: '/dashboard',
      element: <DashboardLayout/>,
      children: [
        { element: <Navigate to="/dashboard/budgets"/>, index: true },
        { path: 'budgets', element: <BudgetPage/> },
        { path: 'transactions', element: <UserPage/> },
        { path: 'statistics', element: <ProductsPage/> },
        { path: 'profile', element: <DashboardAppPage/> },
      ],
    },
    {
      path: 'login',
      element: <LoginPage/>,
    },
    {
      path: "/",
      element: <SimpleLayout/>,
      children: [
        { path: "/", element: <Navigate to="/dashboard/budgets"/> },
        { path: '404', element: <Page404/> },
        { path: '*', element: <Navigate to="/404"/> },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/404" replace/>,
    },
  ]);

  return routes;
}
