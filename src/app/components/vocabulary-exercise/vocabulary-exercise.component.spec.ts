import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { VocabularyExerciseComponent } from './vocabulary-exercise.component';

describe('VocabularyExerciseComponent', () => {
  let component: VocabularyExerciseComponent;
  let fixture: ComponentFixture<VocabularyExerciseComponent>;

  @Component({
    selector: 'app-dummy-category',
    standalone: true,
    template: ''
  })
  class DummyCategoryComponent {}

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule.withRoutes([
          { path: 'category', component: DummyCategoryComponent }
        ]),
        VocabularyExerciseComponent,
        DummyCategoryComponent
      ],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(VocabularyExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
