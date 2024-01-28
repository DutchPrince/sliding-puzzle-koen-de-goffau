import { DatePipe } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-puzzle-timer',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './puzzle-timer.component.html',
  styleUrl: './puzzle-timer.component.scss',
})
export class PuzzleTimerComponent {
  @Input() playing = false;

  ngOnChanges(change: SimpleChanges) {
    if (change['playing']) {
      if (change['playing'].currentValue) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    }
  }

  public time: number = 0;
  private interval: any;

  public startTimer = () => {
    this.interval = setInterval(() => {
      this.time += 1000;
    }, 1000);
  }

  public stopTimer = () => {
    this.time = 0;
    clearInterval(this.interval);
  }
}
