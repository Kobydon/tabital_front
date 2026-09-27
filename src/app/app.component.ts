import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { registerNotifier } from './shared/notify';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'tabitalApp';

  constructor(toastr: ToastrService) {
    // notify() anywhere in the app shows a toast instead of a blocking alert() pop-up
    registerNotifier(toastr);
  }
}
