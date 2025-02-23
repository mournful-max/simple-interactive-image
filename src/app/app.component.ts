import { Component } from '@angular/core';

import { SimpleInteractiveImageComponent } from './simple-interactive-image/simple-interactive-image.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
  imports: [SimpleInteractiveImageComponent]
})
export class AppComponent {
  imageStatus: string = 'Image is loading...';

  onImageLoad() {
    this.imageStatus =
      'Image loaded. Hover over the image to see the control buttons.';
  }
}
