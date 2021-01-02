const Usuario = require('../models/usuario');
const Proyecto = require('../models/proyecto');
const Tarea = require('../models/tarea');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tarea = require('../models/tarea');
require('dotenv').config({path:'variables.env'});
//crea y firma un jwt
const crearToken = (usuario,secreta,expiresIn)=>{
    const {id,email, nombre} = usuario;

    return jwt.sign({id,email, nombre},secreta,{expiresIn});
}

const resolvers = {
    Query:{
        obtenerProyectos: async (_,{},ctx)=>{
            const proyectos = await Proyecto.find({creador: ctx.usuario.id});

            return proyectos;
        },
        obtenerTareas:async (_,{input},ctx)=>{
            const tareas =await Tarea.find({creador:ctx.usuario.id}).where('proyecto').equals(input.proyecto);
            return tareas;
        }
    },
    Mutation:{
        crearUsuario: async (_,{input})=>{
            const {email,password} = input;
            const existeUsuario = await Usuario.findOne({email});
            if(existeUsuario){
                throw new Error('El usuario ya esta registrado');
            }
            try {
                //hashear password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password,salt);
                //registrar nuevo usuaio
                const nuevoUsuario = new Usuario(input);
                nuevoUsuario.save();
                return "Usuario Creado correctamente"
            } catch (error) {
                console.log(error)
            }
        },
        autenticarUsuario: async (_,{input})=>{
            const {email,password} = input;
            //Si el usuario existe
            const existeUsuario = await Usuario.findOne({email});
            if(!existeUsuario){
                throw new Error('El usuario no existe');
            }
            //Si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if(!passwordCorrecto){
                throw new Error('Password incorrecto');
            }
            //dar acceso a la app
            return {
                token: crearToken(existeUsuario,process.env.SECRETA,'2hr')
            }
        },
        nuevoProyecto: async (_,{input},ctx)=>{
            //console.log(ctx)
            try {
                const proyecto = new Proyecto(input);
                //asociar el creador
                proyecto.creador = ctx.usuario.id;
                //almacenar
                const resultado = await proyecto.save();
                return resultado;

            } catch (error) {
                console.log(error);
            }
        },
        actualizarProyecto: async (_,{id,input},ctx)=>{
            //revisar si el proyecto existe o no
            let proyecto = await Proyecto.findById(id);
            if(!proyecto){
                throw new Error('Proyecto no encontrado');
            }
            //revisar si es la persona que lo esta editando
            if(proyecto.creador.toString()!==ctx.usuario.id){
                throw new Error('Privilegios insuficientes para editar este proyecto');
            }
            //guardar
            proyecto = await Proyecto.findByIdAndUpdate({_id:id},input,{new:true});
            return proyecto;
        },
        eliminarProyecto: async (_,{id},ctx)=>{
            //revisar si el proyecto existe o no
            let proyecto = await Proyecto.findById(id);
            if(!proyecto){
                throw new Error('Proyecto no encontrado');
            }
            //revisar si es la persona que lo esta editando
            if(proyecto.creador.toString()!==ctx.usuario.id){
                throw new Error('Privilegios insuficientes para editar este proyecto');
            }
            //eliminar
            await Proyecto.findByIdAndDelete({_id : id});
            return "Proyecto Eliminado"
        },
        nuevaTarea: async (_,{input},ctx)=>{
            try {
                const tarea = new Tarea(input);
                tarea.creador = ctx.usuario.id;
                const resultado = await tarea.save();
                return resultado;
            } catch (error) {
                console.log(error)
            }
        },
        actualizarTarea:async (_,{id,input,estado},ctx)=>{
            //si la tarea existe o no
            let tarea = await Tarea.findById(id);
            if(!tarea){
                throw new Error('Tarea no encontrada');
            }
            //si la persona que lo edita es el propietario
            if(tarea.creador.toString()!==ctx.usuario.id){
                throw new Error('Privilegios insuficientes para editar este proyecto');
            }
            //asignar estado
            input.estado = estado;

            //guardar y retornar
            tarea = await Tarea.findOneAndUpdate({_id:id},input,{new:true});
            return tarea;
        },
        eliminarTarea:async (_,{id},ctx)=>{
            //si la tarea existe o no
            let tarea = await Tarea.findById(id);
            if(!tarea){
                throw new Error('Tarea no encontrada');
            }
            //si la persona que lo edita es el propietario
            if(tarea.creador.toString()!==ctx.usuario.id){
                throw new Error('Privilegios insuficientes para editar este proyecto');
            }
            //eliminar
            await Tarea.findOneAndDelete({_id:id});
            return "Tarea Eliminada"
        }
    }
}

module.exports = resolvers;