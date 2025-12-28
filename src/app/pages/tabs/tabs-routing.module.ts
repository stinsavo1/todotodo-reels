import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { ProfileCompletionGuard } from '../../guards/profile-completion.guard';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'map',
        loadChildren: () =>
          import('../map/map.module').then((m) => m.MapPageModule),
      },
      {
        path: 'menu',
        loadChildren: () =>
          import('../menu/menu.module').then((m) => m.MenuPageModule),
      },
      {
        path: 'addresses',
        loadComponent: () => import('../new/address-chats-list/address-chats-list.component').then(m => m.AddressChatsListComponent)
      },
      {
        path: 'addresses/new-chat/:id/:isManager',
        loadComponent: () => import('../new/new-chat/new-chat.component').then(m => m.NewChatComponent),
      },
      {
        path: 'addresses/order-chats/:id/:segment/:isManager',
        loadComponent: () => import('../new/order-chat-list/order-chat-list.component').then(m => m.OrderChatListComponent),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('../notifications/notifications.module').then(
            (m) => m.NotificationsPageModule,
          ),
        canActivate: [ProfileCompletionGuard]
      },
      {
        path: '',
        redirectTo: '/tabs/map',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/map',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
