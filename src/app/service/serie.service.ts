import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage';
import { Serie } from 'src/app/model/serie';
import { AuthService } from 'src/app/service/auth.service';
import { AngularFirestore, AngularFirestoreCollection, DocumentReference } from '@angular/fire/firestore';
import { map } from 'rxjs/operators'
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class SerieService {

  generos: string[] = [];
  generosAux: string[] = [];
  favoritos: Serie[] = [];

  userId: string;
  series: Serie[];

  constructor(
    private httpClient: HttpClient,
    private db: AngularFirestore,
    private authService: AuthService,
    private alert: AlertController) {
    this.authService.getCurrentUser().subscribe(
      data => this.userId = data.uid
    );

    this.getSeries().subscribe(
      data => {
        data.forEach(f => {
          f.generos.forEach(e => {
            this.generosAux.push(e);
          });
          f.esFav = false;
        });
        this.generosAux.forEach(g => {
          if (!this.generos.includes(g)) {
            this.generos.push(g);
          }
        });
      }
    );

    /*this.getFavoritos().then(
      data => this.favoritos = data == null ? [] : data
    );*/
  }

  getGeneros(): string[] {
    return this.generos;
  }

  getSeries(): Observable<any> {
    return this.httpClient.get('assets/data.json');
  }

  getFavoritos(): Observable<Serie[]> {
    //return this.storage.get('favoritos');
    //return this.db.collection<Serie>('series').valueChanges();
    return this.db.collection<Serie>('users/' + this.userId + '/series').snapshotChanges()
      .pipe(
        map(
          snaps => snaps.map(
            snap => <Serie>{
              id: snap.payload.doc.id,
              ...snap.payload.doc.data() as Serie
            }
          )
        )
      );
  }

  addToFavoritos(serie: Serie): Promise<DocumentReference> {
    //serie.esFav = true;
    //this.favoritos.push(serie);
    //return this.storage.set('favoritos', this.favoritos);
    return this.db.collection<Serie>('users/' + this.userId + '/series').add(serie);
  }

  /*deleteFromFavoritos(serie: Serie) {
   serie.esFav = false;
   this.favoritos = this.favoritos.filter(f => f.id != serie.id);
   return this.storage.set('favoritos', this.favoritos);
 }*/

  public getSerieById(id: string): Observable<Serie> {
    return this.db.collection('users/' + this.userId + '/series').doc<Serie>(id).valueChanges();
  }

  getSeriesfb(): Serie[] {
    return this.series;
  }

  getSerie(nombre: string) {
    return this.series.filter(s => s.titulo == nombre)[0];
  }

  public deleteSerieById(id: string): Promise<void> {
    return this.db.collection('users/' + this.userId + '/series').doc(id).delete();
  }

  async alertDeleteFavorito(id: string, nombre: string) {
    console.log("Alerta");
    const alert = await this.alert.create({
      header: 'Borrar serie',
      message: `¿Estás seguro que quieres borrar la serie <strong> ${nombre}</strong> de tu lista de favoritos?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        }, {
          text: 'Aceptar',
          handler: () => {
            console.log("Se ha eliminado la serie " + id);
            this.deleteSerieById(id);
          }
        }
      ]
    });
    await alert.present();
  }



}
