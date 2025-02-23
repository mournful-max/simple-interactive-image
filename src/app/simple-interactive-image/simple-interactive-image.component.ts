import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'simple-interactive-image',
  templateUrl: './simple-interactive-image.component.html',
  styleUrl: './simple-interactive-image.component.css',
  standalone: true,
  imports: []
})
export class SimpleInteractiveImageComponent {
  @Input('image-src') imageSrc: string = 'image-placeholder.svg';

  @Output('onImageLoad') onImageLoadEvent = new EventEmitter<void>();

  @ViewChild('imageElement') imageElement?: ElementRef<HTMLImageElement>;

  get imageElementLayoutWidth(): number {
    return this.imageElement?.nativeElement.offsetWidth ?? 0;
  }
  get imageElementLayoutHeight(): number {
    return this.imageElement?.nativeElement.offsetHeight ?? 0;
  }

  imageElementOffsetX: number = 0;
  imageElementOffsetY: number = 0;

  imageElementOffsetLowerLimitX: number = 0;
  imageElementOffsetUpperLimitX: number = 0;
  imageElementOffsetLowerLimitY: number = 0;
  imageElementOffsetUpperLimitY: number = 0;

  mouseOffsetStartDragX: number = 0;
  mouseOffsetStartDragY: number = 0;

  lastMouseEventClientX: number = 0;
  lastMouseEventClientY: number = 0;

  isDragging: boolean = false;

  readonly zoomFactorMin: number = 0.5;
  readonly zoomFactorMax: number = 5;

  zoomFactor: number = 1;
  zoomStep: number = 0.25;

  controlButtonsVisible: boolean = false;

  imageElementRotationAngle: number = 0;

  readonly Deg90: number = 90;
  readonly Deg180: number = 180;
  readonly Deg360: number = 360;

  readonly RadPerDeg: number = Math.PI / this.Deg180;

  //#region Internal logic

  private getRotatedRectangleBounds(
    width: number,
    height: number,
    angle: number
  ): { width: number; height: number } {
    const rad = (angle % this.Deg180) * this.RadPerDeg;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));

    return {
      width: width * cos + height * sin,
      height: width * sin + height * cos
    };
  }

  private clampZoomFactor() {
    if (this.zoomFactor < this.zoomFactorMin) {
      this.zoomFactor = this.zoomFactorMin;
    }
    if (this.zoomFactor > this.zoomFactorMax) {
      this.zoomFactor = this.zoomFactorMax;
    }
  }

  private calculateImageOverflowLimits() {
    this.clampZoomFactor();

    const imageElementZoomedWidth =
      this.imageElementLayoutWidth * this.zoomFactor;
    const imageElementZoomedHeight =
      this.imageElementLayoutHeight * this.zoomFactor;

    const rotatedImageElement = this.getRotatedRectangleBounds(
      imageElementZoomedWidth,
      imageElementZoomedHeight,
      this.imageElementRotationAngle
    );

    let overflowX = 0;
    let overflowY = 0;

    if (rotatedImageElement.width > this.imageElementLayoutWidth) {
      overflowX =
        (rotatedImageElement.width - this.imageElementLayoutWidth) /
        2 /
        this.zoomFactor;
    }
    if (rotatedImageElement.height > this.imageElementLayoutHeight) {
      overflowY =
        (rotatedImageElement.height - this.imageElementLayoutHeight) /
        2 /
        this.zoomFactor;
    }

    this.imageElementOffsetLowerLimitX = -overflowX;
    this.imageElementOffsetUpperLimitX = overflowX;
    this.imageElementOffsetLowerLimitY = -overflowY;
    this.imageElementOffsetUpperLimitY = overflowY;
  }

  private preventImageOverflow(
    newImageElementOffsetX: number,
    newImageElementOffsetY: number
  ) {
    if (newImageElementOffsetX < this.imageElementOffsetLowerLimitX) {
      newImageElementOffsetX = this.imageElementOffsetLowerLimitX;
    }
    if (newImageElementOffsetY < this.imageElementOffsetLowerLimitY) {
      newImageElementOffsetY = this.imageElementOffsetLowerLimitY;
    }
    if (newImageElementOffsetX > this.imageElementOffsetUpperLimitX) {
      newImageElementOffsetX = this.imageElementOffsetUpperLimitX;
    }
    if (newImageElementOffsetY > this.imageElementOffsetUpperLimitY) {
      newImageElementOffsetY = this.imageElementOffsetUpperLimitY;
    }

    this.imageElementOffsetX = newImageElementOffsetX;
    this.imageElementOffsetY = newImageElementOffsetY;
  }

  private calculateImageElementOffset() {
    const newImageElementOffsetX =
      (this.lastMouseEventClientX - this.mouseOffsetStartDragX) /
      this.zoomFactor;
    const newImageElementOffsetY =
      (this.lastMouseEventClientY - this.mouseOffsetStartDragY) /
      this.zoomFactor;

    this.preventImageOverflow(newImageElementOffsetX, newImageElementOffsetY);
  }

  //#endregion

  //#region Image container events

  onImageLoad() {
    this.reset();
    this.onImageLoadEvent.emit();
  }

  imageContainerMouseEnter() {
    this.controlButtonsVisible = true;
  }

  imageContainerMouseDown(mouseEvent: MouseEvent) {
    this.controlButtonsVisible = false;
    this.isDragging = true;
    this.lastMouseEventClientX = mouseEvent.clientX;
    this.lastMouseEventClientY = mouseEvent.clientY;

    this.mouseOffsetStartDragX =
      mouseEvent.clientX - this.imageElementOffsetX * this.zoomFactor;
    this.mouseOffsetStartDragY =
      mouseEvent.clientY - this.imageElementOffsetY * this.zoomFactor;
  }

  imageContainerMouseMove(mouseEvent: MouseEvent) {
    if (!this.isDragging) {
      return;
    }

    this.lastMouseEventClientX = mouseEvent.clientX;
    this.lastMouseEventClientY = mouseEvent.clientY;

    this.calculateImageElementOffset();
  }

  imageContainerMouseUp() {
    this.isDragging = false;
    this.controlButtonsVisible = true;
  }

  imageContainerMouseLeave() {
    this.isDragging = false;
    this.controlButtonsVisible = false;
  }

  //#endregion

  //#region Control button events

  controlButtonMouseDown(mouseEvent: MouseEvent) {
    mouseEvent.stopPropagation();
  }

  zoomIn() {
    this.zoomFactor += this.zoomStep;
    this.calculateImageOverflowLimits();
    this.calculateImageElementOffset();
  }

  zoomOut() {
    this.zoomFactor -= this.zoomStep;
    this.calculateImageOverflowLimits();
    this.calculateImageElementOffset();
  }

  rotateClockwise() {
    this.imageElementRotationAngle += this.Deg90;
    this.imageElementRotationAngle %= this.Deg360;
    this.calculateImageOverflowLimits();
    this.calculateImageElementOffset();
  }

  rotateCounterclockwise() {
    this.imageElementRotationAngle -= this.Deg90;
    this.imageElementRotationAngle %= this.Deg360;
    this.calculateImageOverflowLimits();
    this.calculateImageElementOffset();
  }

  reset() {
    this.zoomFactor = 1;
    this.imageElementRotationAngle = 0;
    this.calculateImageOverflowLimits();
    this.calculateImageElementOffset();
  }

  //#endregion

  @HostListener('wheel', ['$event'])
  handleMouseWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();

      if (event.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }
  }
}
