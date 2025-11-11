import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
    canMatch: [AuthGuard],
  },
  {
    path: 'accounts',
    loadChildren: () => import('./features/accounts/accounts.module').then((m) => m.AccountsModule),
    canMatch: [AuthGuard],
  },
  {
    path: 'transactions',
    loadChildren: () => import('./features/transactions/transactions.module').then((m) => m.TransactionsModule),
    canMatch: [AuthGuard],
  },
  {
    path: 'transfer',
    loadChildren: () => import('./features/transfer/transfer.module').then((m) => m.TransferModule),
    canMatch: [AuthGuard],
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.module').then((m) => m.ProfileModule),
    canMatch: [AuthGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
