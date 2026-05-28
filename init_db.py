#!/usr/bin/env python3
"""
Init script para Health App MVP
Crea la BD, tablasy datos de ejemplo
"""

import sqlite3
import os
from pathlib import Path

DB_PATH = "health_app.db"

def init_db():
    """Crea la base de datos y ejecuta el schema"""
    
    # Eliminar BD anterior si existe (solo en dev)
    if Path(DB_PATH).exists():
        print(f"[!] BD existente. Usando: {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Leer y ejecutar schema
    with open("health_app_schema.sql", "r", encoding="utf-8") as f:
        schema = f.read()
    
    # Ejecutar statement por statement
    for statement in schema.split(";"):
        if statement.strip():
            try:
                cursor.execute(statement)
            except sqlite3.Error as e:
                print(f"[ERROR] {e}\n{statement}\n")
    
    conn.commit()
    conn.close()
    print(f"✓ BD creada: {DB_PATH}")

def get_db():
    """Context manager para conexiones"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Acceso por columna
    return conn

def verify_schema():
    """Verifica que todas las tablas existan"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    required = ['usuarios', 'turnos', 'medicinas', 'historial_medicinas', 'recordatorios']
    missing = [t for t in required if t not in tables]
    
    if missing:
        print(f"[ERROR] Tablas faltantes: {missing}")
        return False
    
    print(f"✓ Schema verificado. Tablas: {', '.join(tables)}")
    return True

if __name__ == "__main__":
    init_db()
    verify_schema()
