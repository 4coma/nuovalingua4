import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { ComprehensionExerciseComponent } from './comprehension-exercise.component';

describe('ComprehensionExerciseComponent', () => {
  let component: ComprehensionExerciseComponent;
  let fixture: ComponentFixture<ComprehensionExerciseComponent>;

  @Component({
    selector: 'app-dummy-vocab',
    standalone: true,
    template: ''
  })
  class DummyVocabComponent {}

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule.withRoutes([
          { path: 'vocabulary', component: DummyVocabComponent }
        ]),
        ComprehensionExerciseComponent,
        DummyVocabComponent
      ],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprehensionExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
