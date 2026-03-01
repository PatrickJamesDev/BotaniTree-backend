from PyQt5.QtWidgets import QApplication
from qt_material import apply_stylesheet

def apply_material_theme(app: QApplication):
    apply_stylesheet(app, theme='light_blue.xml')