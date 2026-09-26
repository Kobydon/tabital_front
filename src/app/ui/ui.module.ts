import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import {
  TpButtonDirective, TpCardComponent, TpChipComponent, TpEmptyStateComponent, TpFieldComponent,
  TpNextPaymentComponent, TpPageHeaderComponent, TpPayBarComponent
} from './components';
import { TpConfirmHostComponent } from './confirm';
import { TP_ICONS } from './icons';
import { MoneyPipe, TpDatePipe } from './pipes';

const PARTS = [
  TpButtonDirective, TpFieldComponent, TpCardComponent, TpChipComponent, TpPageHeaderComponent,
  TpEmptyStateComponent, TpNextPaymentComponent, TpPayBarComponent, TpConfirmHostComponent,
  MoneyPipe, TpDatePipe
];

/**
 * Shared Vault UI (Concept A). Import in any feature module to get the components, pipes and
 * <lucide-icon>. Styles live in src/styles/_ui.scss; tokens in src/styles/_tokens.scss.
 */
@NgModule({
  declarations: PARTS,
  imports: [CommonModule, LucideAngularModule.pick(TP_ICONS)],
  exports: [...PARTS, LucideAngularModule]
})
export class UiModule {}
