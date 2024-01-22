import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-puzzle-piece',
  standalone: true,
  imports: [],
  templateUrl: './puzzle-piece.component.html',
  styleUrl: './puzzle-piece.component.scss'
})
export class PuzzlePieceComponent {
  @Input() piece = { img: '', placement: 0, hidden: false };
}
