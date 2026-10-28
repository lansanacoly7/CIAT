# Ajout du statut « Candidature retirée » (suppression douce par le porteur)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_alter_projet_cree_le_alter_projet_statut'),
    ]

    operations = [
        migrations.AlterField(
            model_name='projet',
            name='statut',
            field=models.CharField(choices=[('idee', 'Idée'), ('depose', 'Dossier déposé'), ('selectionne', 'Sélectionné'), ('incube', 'En incubation'), ('prototype', 'Prototype'), ('termine', 'Incubation terminée'), ('rejete', 'Non retenu'), ('retire', 'Candidature retirée')], db_index=True, default='idee', max_length=20),
        ),
    ]
