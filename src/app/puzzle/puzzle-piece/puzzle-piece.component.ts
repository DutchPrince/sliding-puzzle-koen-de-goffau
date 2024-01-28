import { Component, Input } from '@angular/core';
import { PuzzlePiece } from '../models/puzzle-piece.interface';

@Component({
  selector: 'app-puzzle-piece',
  standalone: true,
  imports: [],
  templateUrl: './puzzle-piece.component.html',
  styleUrl: './puzzle-piece.component.scss'
})
export class PuzzlePieceComponent {
  @Input() piece: PuzzlePiece = { img: '', placement: 0, hidden: false };
  @Input() solved = false;
}
