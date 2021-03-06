/// <reference path="../librerias/jquery/index.d.ts" />

$(document).ready(function () {
    console.log("Terminé de cargar el documento");

    $('#btnGuardarCambios').off('click').click(function (event) {
        Principal.Manejador.GuardarCambios();
    });
    Principal.Manejador.CrearListado();
});

namespace Principal {
    export class Manejador {
        public static CrearListado() {
            let userActual: any = JSON.parse(<string>localStorage.getItem('usuarioActual'));
            let arrUsuarios: any = JSON.parse(<string>localStorage.getItem('usuarios'));

            let listaString: string = ` <div class="table-responsive">
                                            <table class="table table-striped" id="tablaUsers">
                                                <thead>
                                                    <th>Correo</th>
                                                    <th>Nombre</th>
                                                    <th>Apellido</th>
                                                    <th>Perfil</th>
                                                    <th>Legajo</th>
                                                    <th>Foto</th>`;

            if (userActual.perfil !== "invitado") {
                listaString += `                    <th>Acciones</th>`;
            }

            listaString += `                    </thead><tbody>`;

            for (let user of arrUsuarios) {
                listaString += `<tr>
                                    <td>`+ user.correo + `</td>
                                    <td>`+ user.nombre + `</td>
                                    <td>`+ user.apellido + `</td>
                                    <td>`+ user.perfil + `</td>
                                    <td>`+ user.legajo + `</td>
                                    <td><img src="./backend/fotos/`+ user.foto + `" height="50px" width="50px"></td>
                                    `;

                switch (userActual.perfil) {
                    case "admin": {
                        listaString += `<td><button type="button" class="btn btn-danger" onclick='Principal.Manejador.Eliminar("` + user.correo + `")' data-toggle="modal" data-target="#confirmarEliminar">Eliminar</button></td>`;
                        break;
                    }
                    case "superadmin": {
                        listaString += `<td><button type="button" class="btn btn-warning" onclick='Principal.Manejador.Modificar("` + user.correo + `")' data-toggle="modal" data-target="#modificacion">Modificar</button></td>`;
                        break;
                    }
                    default:
                        break;
                }
                listaString += `</tr>`;
            }
            listaString += `        </tbody>
                                </table>
                            </div>`;

            $('#listadoDiv').html(listaString);

            Principal.Manejador.CambiarAspecto();

            if (userActual.perfil === "invitado") {
                $('#controles').prop('hidden', false);
            }
        }

        public static Eliminar(correo: string) {
            $("#confirmarTexto").html("Desea eliminar el usuario con correo " + correo + "?");

            $("#modal-btn-si").off('click').on("click", function () {
                Principal.Manejador.EliminarUsuario(correo);
            });
        }

        /**
         * name
         */
        public static EliminarUsuario(correo: string) {
            let arrUsuarios: any = JSON.parse(<string>localStorage.getItem('usuarios'));
            let nuevoArray: any = new Array<any>();
            for (let user of arrUsuarios) {
                if (user.correo === correo) {
                    console.log("Me salteo el usuario");
                    continue;
                }
                else {
                    nuevoArray.push(user);
                }
            }

            //console.log("Seteo la nueva lista y actualizo");
            localStorage.setItem('usuarios', JSON.stringify(nuevoArray));
            Principal.Manejador.CrearListado();
        }
        public static GuardarCambios() {
            let userActual: any = JSON.parse(<string>localStorage.getItem('usuarioActual'));
            let colorFondo = $('#colorFondo').val();
            let colorFuente = $('#colorFuente').val();
            let estiloFoto = $('#marcoImagen').val();

            let opciones: any = {
                "fondo": colorFondo,
                "fuente": colorFuente,
                "estilo": estiloFoto
            };

            localStorage.setItem("op_" + userActual.correo, JSON.stringify(opciones));
            Principal.Manejador.CrearListado();
        }

        private static CambiarAspecto() {
            let userActual: any = JSON.parse(<string>localStorage.getItem('usuarioActual'));

            if (localStorage.getItem('op_' + userActual.correo) != null) {
                console.log("Encuentro opciones");
                let opciones = JSON.parse(<string>localStorage.getItem('op_' + userActual.correo));
                $('#tablaUsers').css({ 'background-color': opciones.fondo, 'color': opciones.fuente });

                $('#colorFondo').val(opciones.fondo);
                $('#colorFuente').val(opciones.fuente);
                $('#marcoImagen').val(opciones.estilo);

                $("#tablaUsers tbody tr").each(function () {
                    //console.log("Entré a la tabla");
                    //console.log(this);
                    $(this).children("td").each(function () {
                        if (opciones.estilo != "") {
                            //console.log(opciones.estilo);
                            $(this).children('img').addClass('img-' + opciones.estilo);
                        }
                    });
                });
            }
        }

        public static Modificar(correo: string) {
            let arrUsuarios: any = JSON.parse(<string>localStorage.getItem('usuarios'));

            for (let user of arrUsuarios) {
                if (user.correo === correo) {
                    $('#nombreText').val(user.nombre);
                    $('#apellidoText').val(user.apellido);
                    $('#mailText').val(user.correo);
                    $('#legajoText').val(user.legajo);
                    $('#perfilText').val(user.perfil);
                    $('#claveText').val(user.clave);
                    $('#claveDuplicadaText').val(user.clave);
                    Principal.Manejador.EliminarUsuario(user.correo);
                    break;
                }
            }

            $("#registroForm").off('submit').submit(function (event) {
                event.preventDefault();

                Principal.Manejador.VerificarModificacion();
            });
        }

        public static VerificarModificacion() {
            let fotoFile: any = $('#fotoFile')[0];
            let formData = new FormData();
            formData.append("foto", fotoFile.files[0]);

            $.ajax({
                method: "POST",
                url: "./backend/guardarImagen.php",
                data: formData,
                contentType: false,
                processData: false,
                success: function (xhr) {
                    let respuesta: any = JSON.parse(<string>xhr);

                    if (respuesta.ok) {
                        Principal.Manejador.ModificarUsuario();
                    }
                    else {
                        $('#alertText').html("Error en " + xhr.error + ". Reingrese.");
                        $('.alert').toggle();
                    }
                }
            });
        }

        public static ModificarUsuario() {
            let nombre: string = <string>$('#nombreText').val();
            let apellido: string = <string>$('#apellidoText').val();
            let mail: string = <string>$('#mailText').val();
            let legajo: string = <string>$('#legajoText').val();
            let perfil: string = <string>$('#perfilText').val();
            let clave: string = <string>$('#claveText').val();
            let fotoFile: any = $('#fotoFile')[0];
            let pathFoto = (<string>(<HTMLInputElement>fotoFile).value).split('\\').reverse()[0];

            let usuario: any = {
                "correo": mail,
                "clave": clave,
                "nombre": nombre,
                "apellido": apellido,
                "legajo": legajo,
                "perfil": perfil,
                "foto": pathFoto
            };

            let arrUsuarios: any = JSON.parse(<string>localStorage.getItem('usuarios'));
            arrUsuarios.push(usuario);
            localStorage.setItem('usuarios', JSON.stringify(arrUsuarios));
            Principal.Manejador.CrearListado();
        }
    }
}