import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PuzzlePieceComponent } from './puzzle-piece/puzzle-piece.component';
import { UserNotificationService } from '../logger.service';

import gsap from 'gsap';
import { PuzzleTimerComponent } from './puzzle-timer/puzzle-timer.component';
import { PuzzlePiece } from './models/puzzle-piece.interface';

@Component({
  selector: 'app-puzzle',
  standalone: true,
  imports: [CommonModule, PuzzlePieceComponent, PuzzleTimerComponent],
  templateUrl: './puzzle.component.html',
  styleUrl: './puzzle.component.scss',
  providers: [UserNotificationService]
})

export class PuzzleComponent {
  @ViewChild('puzzleContainerRef') puzzleContainerRef: ElementRef | undefined;

  public pieces: PuzzlePiece[] = [];
  public removedIndex: number = 0;

  public gridX = 4;
  public gridY = 4;

  private playing = false;
  private tm = gsap.timeline({});
  private tileImg = 'assets/images/Cropped_Image-min.png';

  /**
   * Stole this from the internet, but it checks if two pieces are adjacent inside a 4x4 grid.
   * @param index1 Source index
   * @param index2 Destination index
   * @returns
   */
  private isAdjacent = (index1: number, index2: number): boolean => {
    const x1 = index1 % this.gridX;
    const y1 = Math.floor(index1 / this.gridY);
    const x2 = index2 % this.gridX;
    const y2 = Math.floor(index2 / this.gridY);

    return (x1 === x2 && Math.abs(y1 - y2) === 1) || (y1 === y2 && Math.abs(x1 - x2) === 1);
  }

  constructor(private notify: UserNotificationService) {
    this.createPuzzle();
  }

  /**
   * Creates the puzzle by cutting the image into 16 pieces and shuffling them.
   * The last piece is removed from the puzzle.
   * The pieces are stored in an array of objects with the following properties:
   * - img: The image of the piece
   * - placement: The index of the piece
   * - hidden: Whether the piece is hidden or not
   * Then the pieces are shuffled.
   */
  createPuzzle = () => {
    const img = new Image();
    img.src = this.tileImg;
    img.onload = () => {
      this.loadPuzzleImage(img);
    };
  };

  /**
   * Loads the puzzle image and cuts it into pieces.
   * @param img The image to cut into pieces
   */
  loadPuzzleImage = (img: HTMLImageElement) => {
    if (img.width !== img.height) {
      this.notify.error('Image is not square.');
      return;
    }

    this.resetGame();

    const pieceWidth = Math.floor(img.width / this.gridX);
    const pieceHeight = Math.floor(img.height / this.gridY);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    canvas.width = pieceWidth;
    canvas.height = pieceHeight;

    const gridTotal = this.gridX * this.gridY;

    this.removedIndex = Math.floor(Math.random() * gridTotal);

    for (let index = 0; index < gridTotal; index++) {
      const x = index % this.gridX;
      const y = Math.floor(index / this.gridY);
      ctx.drawImage(img, x * pieceWidth, y * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);
      this.pieces.push({ img: canvas.toDataURL(), placement: index, hidden: index === this.removedIndex });
    }

    this.shuffle();
  }

  /**
   * Shuffles the pieces by swapping them randomly.
   */
  shuffle = () => {
    for (let index = 0; index < this.pieces.length; index++) {
      const randomIndex = Math.floor(Math.random() * this.pieces.length);
      const temp = this.pieces[index];
      this.pieces[index] = this.pieces[randomIndex];
      this.pieces[randomIndex] = temp;
    }
  }

  /**
   * Swaps the piece with the hidden piece.
   * - Checks if the piece is adjacent to the hidden piece
   * - Creates a clone of the piece
   * - Animates the clone to the hidden piece
   * - Swaps the pieces in the array
   * - Removes the clone
   * - Checks if the puzzle is solved
   * @param index The index of the piece to swap
   */
  swap = (index: number) => {
    if (this.isSolved()) {
      return;
    }

    if (!this.isPlaying()) {
      this.playing = true;
    }

    const hiddenIndex = this.pieces.findIndex(piece => piece.hidden);
    if (this.isAdjacent(index, hiddenIndex)) {
      const swapEl = this.pieceEls()[index];
      const hiddenEl = this.pieceEls()[hiddenIndex];

      const xDiff = swapEl.offsetLeft - hiddenEl.offsetLeft;
      const yDiff = swapEl.offsetTop - hiddenEl.offsetTop;

      const clone = swapEl.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = `${swapEl.offsetLeft}px`;
      clone.style.top = `${swapEl.offsetTop}px`;

      this.puzzleContainerRef?.nativeElement.appendChild(clone);

      this.tm.add(gsap.set(swapEl, { autoAlpha: 0 }));
      this.tm.to(clone, {
        duration: 0.35,
        x: `-=${xDiff}`,
        y: `-=${yDiff}`,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(swapEl, {
            autoAlpha: 1
          });

          [this.pieces[index], this.pieces[hiddenIndex]] = [this.pieces[hiddenIndex], this.pieces[index]];

          setTimeout(() => {
            this.puzzleContainerRef?.nativeElement.removeChild(clone);
          }, 0);
        }
      }, '<');
    }
  }

  /**
   * Restarts the puzzle by loading a new image.
   * @param e The event
   */
  onSubmit = (e: any) => {
    e.preventDefault();

    const fileInput = e.target.querySelector('input[name="puzzle_image"]') as HTMLInputElement;

    this.resetErrorMessage(fileInput);

    const file = fileInput?.files?.[0] as File;

    if (!file || file?.size === 0) {
      this.showErrorMessage(fileInput);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        this.loadPuzzleImage(img);
      };
    };

    reader.readAsDataURL(file);
  }

  /**
   * Resets the game by clearing the pieces array and the container.
   */
  resetGame = () => {
    this.playing = false;
    this.pieces = [];
  }

  /**
   * Show error message on input within parameter.
   * @param input The input element
   */
  showErrorMessage = (input: HTMLInputElement) => {
    input?.focus();
    input?.setCustomValidity('Please select an image.');
    input?.reportValidity();
  }

  /**
   * Reset error message on input within parameter.
   * @param input The input element
   */
  resetErrorMessage = (input: HTMLInputElement) => {
    input?.setCustomValidity('');
    input?.reportValidity();
  }

  /**
   * Clear error message on input within parameter.
   * @param input The input element
   */
  clearErrorMessage = (input: EventTarget | null) => {
    if (input instanceof HTMLInputElement) {
      input.setCustomValidity('');
    }
  }

  /**
   * Gets all the puzzle pieces elements from the DOM.
   * @returns All the puzzle pieces
   */
  pieceEls = () => this.puzzleContainerRef?.nativeElement.querySelectorAll('app-puzzle-piece');

  /**
   * Checks if the puzzle is solved.
   * @returns Whether the puzzle is solved or not
   */
  isSolved = (): boolean => {
    return this.pieces.every((piece, index) => piece.placement === index);
  }

  /**
   * Check if game is playing.
   * @returns Whether the game is playing or not
   */
  isPlaying = (): boolean => {
    return this.playing;
  }
}
